import type { NativeSelectController, NativeState } from "@zealakit/omniselect-core";
import { getContext } from "svelte";

export type NativeContext = {
  // biome-ignore lint/suspicious/noExplicitAny: the value type is erased inside context
  controller: NativeSelectController<any>;
  controlId: string;
  /** Svelte store contract: use `$snapshot` in components to react to changes. */
  snapshot: {
    subscribe: (run: (state: NativeState<unknown>) => void) => () => void;
  };
  props: {
    readonly multiple: boolean;
    readonly disabled: boolean;
    readonly required: boolean;
    readonly name: string | undefined;
    readonly form: string | undefined;
    readonly autocomplete: string | undefined;
  };
};

export const NATIVE_KEY = Symbol("omniselect-native");
export const GROUP_KEY = Symbol("omniselect-native-group");

export function getNativeContext(part: string): NativeContext {
  const context = getContext<NativeContext | undefined>(NATIVE_KEY);
  if (!context) {
    throw new Error(`NativeSelect.${part} must be rendered inside NativeSelect.Root.`);
  }
  return context;
}
