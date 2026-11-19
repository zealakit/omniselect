export type SelectionMode = "single" | "multiple";

export type SelectionValue<T, M extends SelectionMode> = M extends "multiple"
  ? T[]
  : T | null;

export type ItemToKey<T> = (value: T) => string;
export type ItemToString<T> = (value: T) => string;

/**
 * Pure selection operations over a value. Equality is by `itemToKey`, so
 * object values work. Nothing is mutated; new arrays are returned.
 */
export type SelectionModel<T> = {
  mode: SelectionMode;
  empty: () => T | null | T[];
  /** Single: replace (no-op if same key). Multi: add if missing. */
  select: (current: T | null | T[], value: T) => T | null | T[];
  /** Single: same as `select`. Multi: add or remove. */
  toggle: (current: T | null | T[], value: T) => T | null | T[];
  remove: (current: T | null | T[], value: T) => T | null | T[];
  isSelected: (current: T | null | T[], value: T) => boolean;
  keys: (current: T | null | T[]) => string[];
  isEmpty: (current: T | null | T[]) => boolean;
};

export function createSelection<T>(options: {
  mode: SelectionMode;
  itemToKey: ItemToKey<T>;
}): SelectionModel<T> {
  const { mode, itemToKey } = options;
  const toList = (current: T | null | T[]): T[] =>
    Array.isArray(current) ? current : current === null ? [] : [current];
  const has = (current: T | null | T[], value: T): boolean => {
    const key = itemToKey(value);
    return toList(current).some((item) => itemToKey(item) === key);
  };

  const model: SelectionModel<T> = {
    mode,
    empty: () => (mode === "multiple" ? [] : null),
    select(current, value) {
      if (mode === "single") {
        if (current !== null && has(current, value)) {
          return current;
        }
        return value;
      }
      return has(current, value) ? current : [...toList(current), value];
    },
    toggle(current, value) {
      if (mode === "single") {
        return model.select(current, value);
      }
      return has(current, value)
        ? model.remove(current, value)
        : model.select(current, value);
    },
    remove(current, value) {
      const key = itemToKey(value);
      if (mode === "single") {
        return current !== null && itemToKey(current as T) === key
          ? null
          : current;
      }
      return toList(current).filter((item) => itemToKey(item) !== key);
    },
    isSelected: has,
    keys: (current) => toList(current).map(itemToKey),
    isEmpty: (current) => toList(current).length === 0,
  };
  return model;
}
