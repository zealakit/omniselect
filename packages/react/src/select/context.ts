import type { SelectMachine } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/ui-engine/position";
import { createContext, useContext } from "react";

export type SelectContextValue = {
  /**
   * The value type is erased at the context boundary: a Provider holds a
   * `SelectMachine<T>` and consumers work with any `T`. The cast lives in
   * `asContextValue` below, so no `any` is needed.
   */
  machine: SelectMachine<unknown>;
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

/**
 * Erase the value type once, at the Provider: `SelectMachine` is invariant in
 * `T`, so a `SelectMachine<T>` cannot be assigned to `SelectMachine<unknown>`
 * without this explicit bridge.
 *
 * @param value The typed context value.
 * @returns The same value with the value type erased.
 */
export function asContextValue<T>(
  value: {
    machine: SelectMachine<T>;
  } & Omit<SelectContextValue, "machine">,
): SelectContextValue {
  return value as unknown as SelectContextValue;
}

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
