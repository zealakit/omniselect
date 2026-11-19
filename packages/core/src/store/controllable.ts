import { devWarn } from "../utils/dev-warn.js";

export type ControllableOptions<T> = {
  /** Controlled value. `undefined` means uncontrolled. */
  value?: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
  equals?: (a: T, b: T) => boolean;
};

export type Controllable<T> = {
  get: () => T;
  /** Request a change. Controlled: only calls `onChange`. */
  set: (next: T) => void;
  /** Replace the uncontrolled value without calling `onChange`. */
  setSilently: (next: T) => void;
  /** Adapter pushes the latest `value` prop and `onChange` after each render. */
  sync: (value: T | undefined, onChange?: (value: T) => void) => void;
  isControlled: () => boolean;
};

/** Controlled/uncontrolled helper shared by value, open, and inputValue. */
export function createControllable<T>(
  options: ControllableOptions<T>,
): Controllable<T> {
  const equals = options.equals ?? Object.is;
  const controlled = options.value !== undefined;
  let controlledValue = options.value;
  let internal = options.defaultValue;
  let onChange = options.onChange;

  return {
    get: () => (controlled ? (controlledValue as T) : internal),
    set(next) {
      const current = controlled ? (controlledValue as T) : internal;
      if (equals(current, next)) {
        return;
      }
      if (!controlled) {
        internal = next;
      }
      onChange?.(next);
    },
    setSilently(next) {
      if (!controlled) {
        internal = next;
      }
    },
    sync(value, nextOnChange) {
      if (nextOnChange) {
        onChange = nextOnChange;
      }
      if (controlled && value === undefined) {
        devWarn(
          "A controlled value became undefined. Keep a value defined for the component's lifetime.",
        );
        return;
      }
      if (!controlled && value !== undefined) {
        devWarn(
          "An uncontrolled component received a value prop. Choose controlled or uncontrolled for its lifetime.",
        );
        return;
      }
      if (controlled) {
        controlledValue = value;
      }
    },
    isControlled: () => controlled,
  };
}
