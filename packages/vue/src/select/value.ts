import { Comment, defineComponent, h, type VNode } from "vue";
import { useSelectContext } from "./context.js";

/**
 * The selected label(s), or the placeholder. The default slot receives
 * `{ labels, isPlaceholder }` for custom rendering.
 */
export const Value = defineComponent({
  name: "SelectValue",
  props: { placeholder: { type: String, default: undefined } },
  setup(props, { slots }) {
    const { machine, version } = useSelectContext("Value");
    return () => {
      version.value;
      const labels = machine.selectedLabels();
      const isPlaceholder = labels.length === 0;
      const custom = slots.default?.({ labels, isPlaceholder });
      // A slot function that renders nothing returns an empty array or comments.
      const provided = (custom ?? []).some(
        (node: VNode) => node.type !== Comment,
      );
      const content = provided
        ? custom
        : isPlaceholder
          ? props.placeholder
          : labels.join(", ");
      return h(
        "span",
        {
          "data-part": "value",
          "data-placeholder": isPlaceholder ? "" : undefined,
        },
        content,
      );
    };
  },
});
