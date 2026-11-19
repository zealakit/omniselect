import { type Collection, createCollection } from "./collection.js";
import { compareDomOrder } from "./dom-order.js";
import {
  createSelection,
  type ItemToKey,
  type SelectionModel,
} from "./selection.js";
import { createControllable } from "./store/controllable.js";
import { createStore, type Store } from "./store/store.js";

export type NativeValue<T> = T | null | T[];

export type NativeSelectOptions<T> = {
  multiple?: boolean;
  itemToKey?: ItemToKey<T>;
  value?: NativeValue<T> | undefined;
  defaultValue?: NativeValue<T> | undefined;
  onValueChange?: (value: NativeValue<T>) => void;
};

export type NativeState<T> = {
  value: NativeValue<T>;
  invalid: boolean;
  /** The `invalid` prop (set by a form library); never cleared internally. */
  invalidProp: boolean;
};

export type NativeSelectController<T> = {
  multiple: boolean;
  collection: Collection<T>;
  selection: SelectionModel<T>;
  store: Store<NativeState<T>>;
  /** `<option value>` for a value. `null` is the placeholder key `""`. */
  keyOf: (value: T | null) => string;
  /** Keys that should be selected for the current value. */
  selectedKeys: () => string[];
  isControlled: () => boolean;
  /** Push the latest props after a render. */
  sync: (options: {
    value?: NativeValue<T> | undefined;
    onValueChange?: ((value: NativeValue<T>) => void) | undefined;
    invalid?: boolean | undefined;
  }) => void;
  /** Read the user's choice from a `<select>` and report it. */
  fromDom: (select: HTMLSelectElement) => void;
  /** Force a `<select>` to show the current value (revert after a rejected change). */
  toDom: (select: HTMLSelectElement) => void;
  /** Form reset: restore `defaultValue` (controlled: ask the parent). */
  reset: () => void;
  setInvalid: (invalid: boolean) => void;
};

/** Framework-independent state for `NativeSelect`. */
export function createNativeSelect<T>(
  options: NativeSelectOptions<T> = {},
): NativeSelectController<T> {
  const multiple = options.multiple ?? false;
  const itemToKey: ItemToKey<T> = options.itemToKey ?? ((v) => String(v));
  const selection = createSelection<T>({
    mode: multiple ? "multiple" : "single",
    itemToKey,
  });
  const empty = selection.empty();
  const defaultValue = options.defaultValue ?? empty;
  const collection = createCollection<T>({ compare: compareDomOrder });
  let onValueChange = options.onValueChange;

  const store = createStore<NativeState<T>>({
    value: options.value !== undefined ? options.value : defaultValue,
    invalid: false,
    invalidProp: false,
  });
  const controllable = createControllable<NativeValue<T>>({
    value: options.value,
    defaultValue,
    equals: (a, b) =>
      selection.keys(a).join("\u0000") === selection.keys(b).join("\u0000") &&
      selection.isEmpty(a) === selection.isEmpty(b),
    onChange(next) {
      if (!controllable.isControlled()) {
        store.set({ value: next });
      }
      store.set({ invalid: false });
      onValueChange?.(next);
    },
  });

  const keyOf = (value: T | null): string =>
    value === null ? "" : itemToKey(value);

  const selectedKeys = (): string[] => {
    const value = store.get().value;
    if (multiple) {
      return selection.keys(value);
    }
    return [value === null ? "" : itemToKey(value as T)];
  };

  const valueForKey = (key: string): T | null =>
    collection.get(key)?.value ?? null;

  return {
    multiple,
    collection,
    selection,
    store,
    keyOf,
    selectedKeys,
    isControlled: controllable.isControlled,
    sync(next) {
      onValueChange = next.onValueChange;
      if (
        next.invalid !== undefined &&
        next.invalid !== store.get().invalidProp
      ) {
        store.set({ invalidProp: next.invalid });
      }
      if (controllable.isControlled()) {
        controllable.sync(next.value);
        if (next.value !== undefined) {
          store.set({ value: next.value });
        }
      }
    },
    fromDom(select) {
      const keys = Array.from(select.options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      if (multiple) {
        const values = keys
          .map(valueForKey)
          .filter((value): value is T => value !== null);
        controllable.set(values);
      } else {
        controllable.set(valueForKey(keys[0] ?? ""));
      }
    },
    toDom(select) {
      const keys = new Set(selectedKeys());
      for (const option of Array.from(select.options)) {
        option.selected = keys.has(option.value);
      }
    },
    reset() {
      controllable.set(defaultValue);
    },
    setInvalid(invalid) {
      store.set({ invalid });
    },
  };
}
