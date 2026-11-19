import { nextId } from "@zealakit/omniselect-core";

export type NativeSelectOptions = {
  /** Called when the user (or a form reset) changes the selection. */
  onValueChange?: (value: string | string[]) => void;
};

export type NativeSelectHandle = {
  /** The key string, or an array of keys when the `<select>` is `multiple`. */
  getValue: () => string | string[];
  /** Select by key. Does not call `onValueChange`. */
  setValue: (value: string | string[]) => void;
  /** Mark the field invalid from outside (`data-invalid`, `aria-invalid`). */
  setInvalid: (invalid: boolean) => void;
  /** Re-read `disabled` / `required` / selection and refresh `data-*` attributes. */
  refresh: () => void;
  /** Remove listeners. Attributes stay as they are. */
  destroy: () => void;
};

function readValue(select: HTMLSelectElement): string | string[] {
  const selected = Array.from(select.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
  return select.multiple ? selected : (selected[0] ?? "");
}

const toggle = (
  element: Element | null | undefined,
  name: string,
  on: boolean,
) => {
  if (!element) {
    return;
  }
  if (on) {
    element.setAttribute(name, "");
  } else {
    element.removeAttribute(name);
  }
};

/**
 * Enhance existing markup: a root element containing one `<select>`, an optional
 * `<label>`, and an optional `[data-part="indicator"]`. Values are strings.
 */
export function createNativeSelect(
  root: HTMLElement,
  options: NativeSelectOptions = {},
): NativeSelectHandle {
  const select =
    root instanceof HTMLSelectElement ? root : root.querySelector("select");
  if (!select) {
    throw new Error(
      "createNativeSelect: no <select> found inside the root element.",
    );
  }
  const scope =
    root instanceof HTMLSelectElement ? (root.parentElement ?? root) : root;
  if (!select.id) {
    select.id = nextId("omniselect-native");
  }
  const label = scope.querySelector("label");
  if (label && !label.contains(select)) {
    label.htmlFor = select.id;
  }
  const indicator = scope.querySelector("[data-part=indicator]");
  indicator?.setAttribute("aria-hidden", "true");

  let last = JSON.stringify(readValue(select));

  const sync = () => {
    const value = readValue(select);
    const empty = Array.isArray(value) ? value.length === 0 : value === "";
    toggle(select, "data-disabled", select.disabled);
    toggle(select, "data-required", select.required);
    toggle(select, "data-placeholder", !select.multiple && empty);
    toggle(label, "data-disabled", select.disabled);
    toggle(label, "data-required", select.required);
    toggle(indicator, "data-disabled", select.disabled);
    for (const option of Array.from(
      select.querySelectorAll("option, optgroup"),
    )) {
      toggle(option, "data-disabled", (option as HTMLOptionElement).disabled);
    }
  };

  const report = () => {
    const value = readValue(select);
    const serialized = JSON.stringify(value);
    if (serialized !== last) {
      last = serialized;
      options.onValueChange?.(value);
    }
  };

  const onChange = () => {
    select.removeAttribute("data-invalid");
    sync();
    report();
  };
  const onInvalid = () => select.setAttribute("data-invalid", "");
  const owner = select.form;
  const onReset = () => {
    queueMicrotask(() => {
      sync();
      report();
    });
  };

  select.addEventListener("change", onChange);
  select.addEventListener("invalid", onInvalid);
  owner?.addEventListener("reset", onReset);
  sync();

  return {
    getValue: () => readValue(select),
    setValue(value) {
      const keys = new Set(Array.isArray(value) ? value : [value]);
      for (const option of Array.from(select.options)) {
        option.selected = keys.has(option.value);
      }
      last = JSON.stringify(readValue(select));
      sync();
    },
    setInvalid(invalid) {
      toggle(select, "data-invalid", invalid);
      if (invalid) {
        select.setAttribute("aria-invalid", "true");
      } else {
        select.removeAttribute("aria-invalid");
      }
    },
    refresh: sync,
    destroy() {
      select.removeEventListener("change", onChange);
      select.removeEventListener("invalid", onInvalid);
      owner?.removeEventListener("reset", onReset);
    },
  };
}
