// oxlint-disable typescript/no-explicit-any -- values are user-defined
import { createNativeSelect, nextId } from "@zealakit/omniselect-core";
import { defineComponent, type PropType, provide, shallowRef, watch, onBeforeUnmount } from "vue";
import { type NativeContext, nativeKey } from "./context.js";

/**
 * Owns value, form props, and the option collection. Renders no element.
 * `v-model` maps to `modelValue`; `valueChange` fires for every change.
 */
export const Root = defineComponent({
  name: "NativeSelectRoot",
  props: {
    modelValue: {
      type: null as unknown as PropType<any>,
      default: undefined,
    },
    defaultValue: {
      type: null as unknown as PropType<any>,
      default: undefined,
    },
    multiple: { type: Boolean, default: false },
    itemToKey: {
      type: Function as PropType<(value: never) => string>,
      default: undefined,
    },
    name: { type: String, default: undefined },
    form: { type: String, default: undefined },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    autocomplete: { type: String, default: undefined },
    /** Mark the field invalid from outside (a form library's error state). */
    invalid: { type: Boolean, default: undefined },
  },
  emits: {
    "update:modelValue": (_value: unknown) => true,
    valueChange: (_value: unknown) => true,
  },
  setup(props, { slots, emit }) {
    const onValueChange = (value: unknown) => {
      emit("update:modelValue", value);
      emit("valueChange", value);
    };
    const controller = createNativeSelect<unknown>({
      multiple: props.multiple,
      itemToKey: props.itemToKey as ((value: unknown) => string) | undefined,
      value: props.modelValue as never,
      defaultValue: props.defaultValue as never,
      onValueChange: onValueChange as never,
    });
    const version = shallowRef(0);
    const stop = controller.store.subscribe(() => {
      version.value += 1;
    });
    onBeforeUnmount(stop);
    watch(
      () => [props.modelValue, props.invalid],
      () =>
        controller.sync({
          value: props.modelValue as never,
          onValueChange: onValueChange as never,
          invalid: props.invalid,
        }),
      { flush: "sync", immediate: true },
    );

    const context: NativeContext = {
      controller,
      controlId: nextId("omniselect-native"),
      version,
      props: new Proxy({} as NativeContext["props"], {
        get: (_target, key: string) => (props as Record<string, unknown>)[key],
      }),
    };
    provide(nativeKey, context);
    return () => slots.default?.();
  },
});
