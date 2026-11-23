import type { SelectMachine } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-react";
import { createContext, useContext } from "react";

export type SelectContextValue = {
  // oxlint-disable-next-line typescript/no-explicit-any -- the value type is erased inside context
  machine: SelectMachine<any>;
  triggerEl: HTMLElement | null;
  setTriggerEl: (element: HTMLElement | null) => void;
  controlEl: HTMLElement | null;
  setControlEl: (element: HTMLElement | null) => void;
  /** Return focus to the trigger (after select, Escape, Tab, Clear). */
  focusTrigger: () => void;
  /** Focus the input in combobox mode, the trigger otherwise. */
  focusField: () => void;
  inputRef: { current: HTMLInputElement | null };
  placement: Placement;
  offset: number;
  matchWidth: boolean;
  portal: boolean | Element | null;
};

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelectContext(part: string): SelectContextValue {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error(`Select.${part} must be rendered inside Select.Root.`);
  }
  return context;
}

export type GroupContextValue = {
  groupId: string;
  setHasLabel: (hasLabel: boolean) => void;
};
export const GroupContext = createContext<GroupContextValue | null>(null);

export const ItemContext = createContext<{ key: string } | null>(null);
