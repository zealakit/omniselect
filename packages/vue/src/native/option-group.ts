import { defineComponent, h, provide, reactive } from "vue";
import { groupKey } from "./context.js";

/** `<optgroup>`. Disabling it disables every option inside. */
export const OptionGroup = defineComponent({
  name: "NativeSelectOptionGroup",
  props: {
    label: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { slots, attrs }) {
    const state = reactive({
      get disabled() {
        return props.disabled;
      },
    });
    provide(groupKey, state);
    return () =>
      h(
        "optgroup",
        {
          ...attrs,
          label: props.label,
          disabled: props.disabled,
          "data-disabled": props.disabled ? "" : undefined,
        },
        slots.default?.(),
      );
  },
});
