import type { NativeSelectController } from "@zealakit/omniselect-core";
import { createContext, useContext } from "react";

export type NativeContextValue = {
  /**
   * The value type is erased at the context boundary; `asNativeContext` below is
   * the one explicit bridge, so no `any` is needed.
   */
  controller: NativeSelectController<unknown>;
  controlId: string;
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  name: string | undefined;
  form: string | undefined;
  autoComplete: string | undefined;
  /** Keys to show when the Root is controlled; `undefined` when uncontrolled. */
  controlledKeys: string[] | undefined;
  defaultKeys: string[];
};

export const NativeContext = createContext<NativeContextValue | null>(null);

/**
 * Erase the value type once, at the Provider.
 *
 * @param value The typed context value.
 * @returns The same value with the value type erased.
 */
export function asNativeContext<T>(
  value: {
    controller: NativeSelectController<T>;
  } & Omit<NativeContextValue, "controller">,
): NativeContextValue {
  return value as unknown as NativeContextValue;
}

export function useNativeContext(part: string): NativeContextValue {
  const context = useContext(NativeContext);
  if (!context) {
    throw new Error(`NativeSelect.${part} must be rendered inside NativeSelect.Root.`);
  }
  return context;
}

type OptionGroupContextValue = { disabled: boolean };
export const OptionGroupContext = createContext<OptionGroupContextValue>({
  disabled: false,
});
