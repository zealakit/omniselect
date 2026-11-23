import type { NativeSelectController } from "@zealakit/omniselect-core";
import { createContext, useContext } from "react";

export type NativeContextValue = {
  // oxlint-disable-next-line typescript/no-explicit-any -- the value type is erased inside context
  controller: NativeSelectController<any>;
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
