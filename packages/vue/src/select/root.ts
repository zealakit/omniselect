// biome-ignore-all lint/suspicious/noExplicitAny: values are user-defined
import { createSelectMachine, nextId } from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-vue";
import {
  defineComponent,
  onBeforeUnmount,
  type PropType,
  provide,
  shallowRef,
  watch,
} from "vue";
import { type SelectContext, selectKey } from "./context.js";

/**
 * State orchestrator. Renders no element.
 * `v-model` maps to `modelValue`, `v-model:open` to `open`.
 */
export const Root = defineComponent({
  name: "SelectRoot",
  props: {
    modelValue: { type: null as unknown as PropType<any>, default: undefined },
    defaultValue: {
      type: null as unknown as PropType<any>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    itemToKey: {
      type: Function as PropType<(value: any) => string>,
      default: undefined,
    },
    itemToString: {
      type: Function as PropType<(value: any) => string>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    closeOnSelect: { type: Boolean, default: undefined },
    allowsEmptyCollection: { type: Boolean, default: undefined },
    loop: { type: Boolean, default: undefined },
    placement: { type: String as PropType<Placement>, default: "bottom-start" },
    offset: { type: Number, default: 4 },
    matchWidth: { type: Boolean, default: true },
    portal: {
      type: [Boolean, String, Object] as PropType<
        boolean | string | Element | null
      >,
      default: true,
    },
  },
  emits: {
    "update:modelValue": (_value: unknown) => true,
    valueChange: (_value: unknown) => true,
    "update:open": (_open: boolean) => true,
    openChange: (_open: boolean, _reason: string) => true,
  },
  setup(props, { slots, emit }) {
    const triggerEl = shallowRef<HTMLElement | null>(null);
    const controlEl = shallowRef<HTMLElement | null>(null);
    const onValueChange = (value: unknown) => {
      emit("update:modelValue", value);
      emit("valueChange", value);
    };
    const machine = createSelectMachine<any>({
      rootId: nextId("omniselect"),
      itemToKey: props.itemToKey,
      itemToString: props.itemToString,
      value: props.modelValue,
      defaultValue: props.defaultValue,
      onValueChange,
      open: props.open,
      defaultOpen: props.defaultOpen,
      disabled: props.disabled,
      required: props.required,
      closeOnSelect: props.closeOnSelect,
      allowsEmptyCollection: props.allowsEmptyCollection,
      loop: props.loop,
      onOpenChange(open, reason) {
        emit("update:open", open);
        emit("openChange", open, reason);
        if (
          !open &&
          (reason === "select" || reason === "escape" || reason === "tab")
        ) {
          triggerEl.value?.focus();
        }
      },
    });
    const version = shallowRef(0);
    const stop = machine.store.subscribe(() => {
      version.value += 1;
    });
    onBeforeUnmount(() => {
      stop();
      machine.destroy();
    });
    watch(
      () => [
        props.modelValue,
        props.open,
        props.disabled,
        props.required,
        props.closeOnSelect,
        props.allowsEmptyCollection,
        props.loop,
      ],
      () =>
        machine.sync({
          value: props.modelValue,
          onValueChange,
          open: props.open,
          disabled: props.disabled,
          required: props.required,
          closeOnSelect: props.closeOnSelect,
          allowsEmptyCollection: props.allowsEmptyCollection,
          loop: props.loop,
        }),
      { flush: "sync" },
    );

    const context: SelectContext = {
      machine,
      version,
      triggerEl,
      controlEl,
      focusTrigger: () => triggerEl.value?.focus(),
      props: new Proxy({} as SelectContext["props"], {
        get: (_target, key: string) => (props as Record<string, unknown>)[key],
      }),
    };
    provide(selectKey, context);
    return () => slots.default?.();
  },
});
