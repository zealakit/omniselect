import type { SelectMachine } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-vue";
import { type InjectionKey, inject, type Ref, type ShallowRef } from "vue";

export type SelectContext = {
  // biome-ignore lint/suspicious/noExplicitAny: the value type is erased inside context
  machine: SelectMachine<any>;
  /** Bumped on every machine state change; read it inside render functions. */
  version: Ref<number>;
  triggerEl: ShallowRef<HTMLElement | null>;
  controlEl: ShallowRef<HTMLElement | null>;
  inputEl: ShallowRef<HTMLInputElement | null>;
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

export const selectKey: InjectionKey<SelectContext> = Symbol("omniselect-select");
export const groupKey: InjectionKey<{
  groupId: string;
  hasLabel: Ref<boolean>;
}> = Symbol("omniselect-select-group");
export const itemKey: InjectionKey<{ key: () => string }> = Symbol("omniselect-select-item");

export function useSelectContext(part: string): SelectContext {
  const context = inject(selectKey, null);
  if (!context) {
    throw new Error(`Select.${part} must be rendered inside Select.Root.`);
  }
  return context;
}
