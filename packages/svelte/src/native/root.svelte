<script lang="ts" generics="T">
import {
  createNativeSelect,
  type NativeState,
  nextId,
} from "@zealakit/omniselect-core";
import { setContext, untrack, type Snippet } from "svelte";
import { NATIVE_KEY, type NativeContext } from "./context.js";

type Props = {
  /** Mark the field invalid from outside (a form library's error state). */
  invalid?: boolean;
  /** Selected value (`T | null`, or `T[]` with `multiple`). Use `bind:value` or `value` + `onValueChange`. */
  value?: T | null | T[];
  defaultValue?: T | null | T[];
  multiple?: boolean;
  /** Map a value to the string used as `<option value>` and submitted in forms. */
  itemToKey?: (value: T) => string;
  onValueChange?: (value: T | null | T[]) => void;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
  children?: Snippet;
};

let {
  value = $bindable(),
  defaultValue,
  multiple = false,
  itemToKey,
  onValueChange,
  name,
  form,
  required = false,
  disabled = false,
  autocomplete,
  invalid,
  children,
}: Props = $props();

const handleChange = (next: T | null | T[]) => {
  value = next;
  onValueChange?.(next);
};

const controller = untrack(() =>
  createNativeSelect<T>({
    multiple,
    itemToKey,
    value,
    defaultValue,
    onValueChange: handleChange as never,
  }),
);

$effect.pre(() => {
  controller.sync({ value, onValueChange: handleChange as never, invalid });
});

const snapshot = {
  subscribe(run: (state: NativeState<unknown>) => void) {
    run(controller.store.get());
    return controller.store.subscribe(run);
  },
};

const context: NativeContext = {
  controller,
  controlId: nextId("omniselect-native"),
  snapshot,
  props: {
    get multiple() {
      return multiple;
    },
    get disabled() {
      return disabled;
    },
    get required() {
      return required;
    },
    get name() {
      return name;
    },
    get form() {
      return form;
    },
    get autocomplete() {
      return autocomplete;
    },
  },
};
setContext(NATIVE_KEY, context);
</script>

{@render children?.()}
