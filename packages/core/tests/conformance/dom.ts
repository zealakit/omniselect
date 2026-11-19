import type { PartRef, Scenario } from "./types.ts";

/** Native-select part lookup shared by every adapter driver. */
export function queryNativePart(
  root: ParentNode,
  ref: PartRef,
): Element | null {
  if (ref === "control") {
    return root.querySelector("select");
  }
  if (ref === "label") {
    return root.querySelector("label");
  }
  if (ref === "indicator") {
    return root.querySelector("[data-part=indicator], span[aria-hidden=true]");
  }
  if (ref.startsWith("option:")) {
    const key = ref.slice("option:".length);
    return (
      Array.from(root.querySelectorAll("option")).find(
        (option) => option.getAttribute("value") === key,
      ) ?? null
    );
  }
  if (ref.startsWith("group:")) {
    const label = ref.slice("group:".length);
    return (
      Array.from(root.querySelectorAll("optgroup")).find(
        (group) => group.getAttribute("label") === label,
      ) ?? null
    );
  }
  return null;
}

export function readNativeValue(root: ParentNode): unknown {
  const select = root.querySelector("select");
  if (!select) {
    return null;
  }
  const selected = Array.from(select.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
  return select.multiple ? selected : (selected[0] ?? "");
}

/**
 * Serialize a form like `new FormData(form)`. happy-dom's FormData drops all
 * but the first value of a `<select multiple>`, so entries are built by hand.
 */
export function readFormData(root: ParentNode): [string, string][] {
  const form = root.querySelector("form");
  if (!form) {
    return [];
  }
  const entries: [string, string][] = [];
  for (const element of Array.from(form.elements) as HTMLElement[]) {
    const field = element as unknown as HTMLInputElement & {
      options: HTMLOptionsCollection;
    };
    const name = field.getAttribute("name");
    if (!name || field.disabled) {
      continue;
    }
    if (field.tagName === "SELECT") {
      for (const option of Array.from(field.options)) {
        if (option.selected && !option.disabled) {
          entries.push([name, option.value]);
        }
      }
    } else if (field.type === "checkbox" || field.type === "radio") {
      if (field.checked) {
        entries.push([name, field.value || "on"]);
      }
    } else {
      entries.push([name, field.value]);
    }
  }
  return entries;
}

export function makeItemToKey(
  keyBy: string | undefined,
): ((value: unknown) => string) | undefined {
  if (!keyBy) {
    return undefined;
  }
  return (value) =>
    value === null ? "" : String((value as Record<string, unknown>)[keyBy]);
}

/** Replace listed callback props with loggers that record into `log`. */
export function withCallbacks(
  scenario: Scenario,
  log: { name: string; args: unknown[] }[],
): Record<string, unknown> {
  const props: Record<string, unknown> = { ...(scenario.props ?? {}) };
  for (const name of scenario.callbacks ?? []) {
    props[name] = (...args: unknown[]) => {
      log.push({ name, args: JSON.parse(JSON.stringify(args)) });
    };
  }
  const itemToKey = makeItemToKey(scenario.keyBy);
  if (itemToKey) {
    props.itemToKey = itemToKey;
  }
  return props;
}

/** DOM steps that are identical in every adapter. Returns `true` if handled. */
export function performNativeDomStep(
  root: ParentNode,
  step: { type: string; [key: string]: unknown },
): boolean {
  const select = root.querySelector("select");
  switch (step.type) {
    case "select": {
      const target = queryNativePart(
        root,
        step.target as string,
      ) as HTMLSelectElement;
      const wanted = new Set(step.values as string[]);
      for (const option of Array.from(target.options)) {
        option.selected = wanted.has(option.value);
      }
      target.dispatchEvent(new window.Event("input", { bubbles: true }));
      target.dispatchEvent(new window.Event("change", { bubbles: true }));
      return true;
    }
    case "invalid":
      queryNativePart(root, step.target as string)?.dispatchEvent(
        new window.Event("invalid", { cancelable: true }),
      );
      return true;
    case "focus":
      (
        queryNativePart(root, step.target as string) as HTMLElement | null
      )?.focus();
      return true;
    case "blur":
      (select as HTMLElement | null)?.blur();
      return true;
    case "resetForm":
      (root.querySelector("form") as HTMLFormElement | null)?.reset();
      return true;
    case "submitForm":
      return true;
    default:
      return false;
  }
}
