import type { NativeSelectController } from "@zealakit/omniselect-core";
import { type InjectionKey, inject, type Ref } from "vue";

export type NativeContext = {
  controller: NativeSelectController<unknown>;
  controlId: string;
  /** Bumped whenever the controller state changes; read it in render functions. */
  version: Ref<number>;
  props: {
    multiple: boolean;
    disabled: boolean;
    required: boolean;
    name: string | undefined;
    form: string | undefined;
    autocomplete: string | undefined;
  };
};

export const nativeKey: InjectionKey<NativeContext> = Symbol("omniselect-native");
export const groupKey: InjectionKey<{ disabled: boolean }> = Symbol("omniselect-native-group");

export function useNativeContext(part: string): NativeContext {
  const context = inject(nativeKey, null);
  if (!context) {
    throw new Error(`NativeSelect.${part} must be rendered inside NativeSelect.Root.`);
  }
  return context;
}
