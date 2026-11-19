import { checkStructure } from "@zealakit/omniselect-core";
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from "vue";
import { useSelectContext } from "./context.js";
import { attrsOf } from "./simple.js";

/** Button that resets the selection. Place it beside the trigger, never inside it. */
export const Clear = defineComponent({
  name: "SelectClear",
  props: { label: { type: String, default: "Clear selection" } },
  setup(props, { slots }) {
    const context = useSelectContext("Clear");
    const { machine } = context;
    const element = ref<HTMLElement | null>(null);
    let off: (() => void) | undefined;
    onMounted(() => {
      checkStructure("Clear", element.value);
      off = machine.registerClear();
    });
    onBeforeUnmount(() => off?.());
    return () => {
      context.version.value;
      const hasValue = !machine.selection.isEmpty(machine.store.get().value);
      return h(
        "button",
        {
          type: "button",
          "data-part": "clear",
          ref: element,
          ...attrsOf(machine.attrs.clear(props.label)),
          hidden: !hasValue,
          onClick: () => {
            machine.clear();
            context.focusTrigger();
          },
        },
        slots.default?.(),
      );
    };
  },
});
