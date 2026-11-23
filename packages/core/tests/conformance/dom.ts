import { MockIntersectionObserver } from "../support/intersection-observer.ts";
import type { PartRef, Scenario } from "./types.ts";

/** Native-select part lookup shared by every adapter driver. */
export function queryNativePart(root: ParentNode, ref: PartRef): Element | null {
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

function encodeKey(key: string): string {
  return encodeURIComponent(key).replaceAll("%", "_");
}

/** Select part lookup. Popover content is portaled, so the whole document is searched. */
export function querySelectPart(root: ParentNode, ref: PartRef): Element | null {
  const doc = root.ownerDocument ?? document;
  const first = (selector: string) => doc.querySelector(selector);
  if (ref === "trigger") return first("[data-part=trigger]");
  if (ref === "input") return first("input[role=combobox]");
  if (ref === "list") return first("[role=listbox]");
  if (ref === "outside") return first("[data-part=outside]");
  if (ref.startsWith("item:")) {
    return first(`[role=option][id$="-item-${encodeKey(ref.slice(5))}"]`);
  }
  if (ref.startsWith("group:")) {
    return first("[role=group]");
  }
  if (ref.startsWith("itemIndicator:")) {
    return first(
      `[role=option][id$="-item-${encodeKey(ref.slice(14))}"] [data-part=item-indicator]`,
    );
  }
  return first(`[data-part=${ref.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`);
}

export function readSelectVisibleItems(root: ParentNode): string[] {
  const doc = root.ownerDocument ?? document;
  return Array.from(doc.querySelectorAll("[role=option]"))
    .filter((el) => (el.getAttribute("id") ?? "").includes("-item-"))
    .map((el) => {
      const id = el.getAttribute("id") ?? "";
      const raw = id.slice(id.indexOf("-item-") + 6);
      return decodeURIComponent(raw.replaceAll("_", "%"));
    });
}

const keyboardInit = (
  key: string,
  mods: { shift?: boolean; alt?: boolean; ctrl?: boolean; meta?: boolean } = {},
) => ({
  key,
  shiftKey: mods.shift ?? false,
  altKey: mods.alt ?? false,
  ctrlKey: mods.ctrl ?? false,
  metaKey: mods.meta ?? false,
  bubbles: true,
  cancelable: true,
});

/** Set `value` the way a user edit does, so React notices the change. */
function setNativeValue(input: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
  if (setter) {
    setter.call(input, text);
  } else {
    input.value = text;
  }
}

function pointer(target: Element, type: string): void {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "button", { value: 0 });
  Object.defineProperty(event, "isPrimary", { value: true });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  target.dispatchEvent(event);
}

/** DOM steps for Select scenarios, identical in every adapter. Returns `true` if handled. */
export function performSelectDomStep(
  root: ParentNode,
  step: { type: string; [key: string]: unknown },
): boolean {
  const find = (ref: string) => querySelectPart(root, ref) as HTMLElement | null;
  switch (step.type) {
    case "press": {
      const target = find((step.target as string | undefined) ?? "trigger");
      target?.dispatchEvent(
        new window.KeyboardEvent("keydown", keyboardInit(step.key as string, step.mods as never)),
      );
      return true;
    }
    case "fill": {
      const target = find(
        (step.target as string | undefined) ?? "input",
      ) as HTMLInputElement | null;
      if (target) {
        setNativeValue(target, step.text as string);
        target.dispatchEvent(new window.Event("input", { bubbles: true }));
      }
      return true;
    }
    case "compose": {
      // IME: compositionstart, input while composing, compositionend.
      const target = find(
        (step.target as string | undefined) ?? "input",
      ) as HTMLInputElement | null;
      if (target) {
        target.dispatchEvent(new window.Event("compositionstart", { bubbles: true }));
        setNativeValue(target, step.text as string);
        const event = new window.Event("input", { bubbles: true });
        Object.defineProperty(event, "isComposing", { value: true });
        target.dispatchEvent(event);
        target.dispatchEvent(new window.Event("compositionend", { bubbles: true }));
      }
      return true;
    }
    case "type": {
      const target = find((step.target as string | undefined) ?? "trigger");
      for (const char of step.text as string) {
        target?.dispatchEvent(new window.KeyboardEvent("keydown", keyboardInit(char)));
      }
      return true;
    }
    case "click": {
      const target = find(step.target as string);
      if (target) {
        pointer(target, "pointerdown");
        target.dispatchEvent(
          new window.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
          }),
        );
        pointer(target, "pointerup");
        target.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      }
      return true;
    }
    case "intersect": {
      const target = find(step.target as string);
      if (target) {
        MockIntersectionObserver.setIntersecting(
          target,
          (step.value as boolean | undefined) ?? true,
        );
      }
      return true;
    }
    case "hover": {
      const target = find(step.target as string);
      if (target) {
        pointer(target, "pointermove");
      }
      return true;
    }
    case "focus":
      find(step.target as string)?.focus();
      return true;
    case "blur":
      (document.activeElement as HTMLElement | null)?.blur();
      return true;
    case "invalid":
      find(step.target as string)?.dispatchEvent(new window.Event("invalid", { cancelable: true }));
      return true;
    case "submitForm":
      return true;
    case "resetForm":
      (root.querySelector("form") as HTMLFormElement | null)?.reset();
      return true;
    default:
      return false;
  }
}

export function makeItemToString(
  labelBy: string | undefined,
): ((value: unknown) => string) | undefined {
  if (!labelBy) {
    return undefined;
  }
  return (value) => String((value as Record<string, unknown>)[labelBy]);
}

export function makeItemToKey(keyBy: string | undefined): ((value: unknown) => string) | undefined {
  if (!keyBy) {
    return undefined;
  }
  return (value) => (value === null ? "" : String((value as Record<string, unknown>)[keyBy]));
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
  const itemToString = makeItemToString(scenario.labelBy);
  if (itemToString) {
    props.itemToString = itemToString;
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
      const target = queryNativePart(root, step.target as string) as HTMLSelectElement;
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
      (queryNativePart(root, step.target as string) as HTMLElement | null)?.focus();
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
