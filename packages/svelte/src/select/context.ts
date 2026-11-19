import type { SelectMachine, SelectState } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-svelte";
import { getContext } from "svelte";

export type SelectContext = {
  // biome-ignore lint/suspicious/noExplicitAny: the value type is erased inside context
  machine: SelectMachine<any>;
  /** Svelte store contract: use `$snapshot` in components to react to machine changes. */
  snapshot: {
    subscribe: (run: (state: SelectState<unknown>) => void) => () => void;
  };
  readonly triggerEl: HTMLElement | null;
  readonly controlEl: HTMLElement | null;
  setTriggerEl: (element: HTMLElement | null) => void;
  setControlEl: (element: HTMLElement | null) => void;
  focusTrigger: () => void;
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
