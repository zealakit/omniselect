import { createNativeSelect, type NativeSelectController } from "@zealakit/omniselect-core";
import { type ReactNode, useId, useRef } from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { NativeContext, type NativeContextValue } from "./context.js";

type RootBase<T> = {
  /** Map a value to the string used as `<option value>` and submitted in forms. */
  itemToKey?: (value: T) => string;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  /** Mark the field invalid from outside (a form library's error state). */
  invalid?: boolean;
  children?: ReactNode;
};

export type NativeSelectSingleProps<T> = RootBase<T> & {
  multiple?: false;
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
};

export type NativeSelectMultipleProps<T> = RootBase<T> & {
  multiple: true;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
};

export type NativeSelectRootProps<T> = NativeSelectSingleProps<T> | NativeSelectMultipleProps<T>;

type AnyValue<T> = T | null | T[];

/** Owns value, form props, and the option collection. Renders no element. */
export function Root<T>(props: NativeSelectRootProps<T>) {
  const {
    children,
    multiple = false,
    itemToKey,
    value,
    defaultValue,
    onValueChange,
    name,
    form,
    required = false,
    disabled = false,
    autoComplete,
    invalid,
  } = props as RootBase<T> & {
    multiple?: boolean;
    value?: AnyValue<T>;
    defaultValue?: AnyValue<T>;
    onValueChange?: (value: AnyValue<T>) => void;
  };
  const controlId = useId();
  const controllerRef = useRef<NativeSelectController<T> | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createNativeSelect<T>({
      multiple,
      itemToKey,
      value,
      defaultValue,
      onValueChange,
    });
  }
  const controller = controllerRef.current;

  useIsomorphicLayoutEffect(() => {
    controller.sync({ value, onValueChange, invalid });
  });

  const keysOf = (current: AnyValue<T> | undefined): string[] => {
    if (current === undefined) {
      return [];
    }
    return multiple
      ? controller.selection.keys(current)
      : [current === null ? "" : controller.keyOf(current as T)];
  };

  const context: NativeContextValue = {
    controller,
    controlId,
    multiple,
    disabled,
    required,
    name,
    form,
    autoComplete,
    controlledKeys: value === undefined ? undefined : keysOf(value),
    defaultKeys: keysOf(defaultValue ?? controller.selection.empty()),
  };

  return <NativeContext.Provider value={context}>{children}</NativeContext.Provider>;
}
