// biome-ignore-all lint/suspicious/noExplicitAny: values are user-defined
import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  watch,
} from "vue";
import { groupKey, useNativeContext } from "./context.js";

/** `<option>` that registers its value with the Root. `value: null` is the placeholder. */
export const Option = defineComponent({
  name: "NativeSelectOption",
  props: {
    value: { type: null as unknown as PropType<any>, default: null },
    textValue: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const context = useNativeContext("Option");
    const group = inject(groupKey, { disabled: false });
    const element = ref<HTMLOptionElement | null>(null);
    let unregister: (() => void) | undefined;

    const key = () => context.controller.keyOf(props.value);
    const isDisabled = () => props.disabled || group.disabled;
    const register = () => {
      unregister?.();
      unregister = context.controller.collection.register({
        key: key(),
        value: props.value,
        textValue: props.textValue ?? element.value?.textContent ?? "",
        disabled: isDisabled(),
        node: element.value,
      });
    };
    onMounted(register);
    watch([key, () => props.textValue, isDisabled], () => register(), {
      flush: "post",
    });
    onBeforeUnmount(() => unregister?.());

    return () => {
      context.version.value;
      const selected = context.controller.selectedKeys().includes(key());
      return h(
        "option",
        {
          ref: element,
          value: key(),
          selected,
          disabled: isDisabled(),
          "data-disabled": isDisabled() ? "" : undefined,
        },
        slots.default?.(),
      );
    };
  },
});
