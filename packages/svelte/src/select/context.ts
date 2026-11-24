import type { SelectMachine, SelectState } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/ui-engine/position";
import { getContext } from "svelte";

export type SelectContext = {
  // oxlint-disable-next-line typescript/no-explicit-any -- the value type is erased inside context
  machine: SelectMachine<any>;
  /** Svelte store contract: use `$snapshot` in components to react to machine changes. */
  snapshot: {
    subscribe: (run: (state: SelectState<unknown>) => void) => () => void;
  };
  readonly triggerEl: HTMLElement | null;
  readonly controlEl: HTMLElement | null;
  readonly inputEl: HTMLInputElement | null;
  setTriggerEl: (element: HTMLElement | null) => void;
  setControlEl: (element: HTMLElement | null) => void;
  setInputEl: (element: HTMLInputElement | null) => void;
  focusTrigger: () => void;
  /** Focus the input in combobox mode, the trigger otherwise. */
  focusField: () => void;
  props: {
    readonly placement: Placement;
    readonly offset: number;
    readonly matchWidth: boolean;
    readonly portal: boolean | string | Element | null;
  };
};

export const SELECT_KEY = Symbol("omniselect-select");
export const GROUP_KEY = Symbol("omniselect-select-group");
export const ITEM_KEY = Symbol("omniselect-select-item");

export function getSelectContext(part: string): SelectContext {
  const context = getContext<SelectContext | undefined>(SELECT_KEY);
  if (!context) {
    throw new Error(`Select.${part} must be rendered inside Select.Root.`);
  }
  return context;
}
