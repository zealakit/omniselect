import { defineComponent, h } from "vue";
import { useNativeContext } from "./context.js";

/** Decorative slot (for example a chevron). Hidden from assistive technology. */
export const Indicator = defineComponent({
  name: "NativeSelectIndicator",
  setup(_props, { slots }) {
    const context = useNativeContext("Indicator");
    return () =>
      h(
        "span",
        {
          "data-part": "indicator",
          "data-disabled": context.props.disabled ? "" : undefined,
          "aria-hidden": "true",
        },
        slots.default?.(),
      );
  },
});
