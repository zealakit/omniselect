import { defineComponent, h } from "vue";
import { useNativeContext } from "./context.js";

/** `<label>` linked to the control. */
export const Label = defineComponent({
  name: "NativeSelectLabel",
  setup(_props, { slots }) {
    const context = useNativeContext("Label");
    return () =>
      h(
        "label",
        {
          for: context.controlId,
          "data-disabled": context.props.disabled ? "" : undefined,
          "data-required": context.props.required ? "" : undefined,
        },
        slots.default?.(),
      );
  },
});
