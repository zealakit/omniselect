import { defineComponent, h } from "vue";
import { useSelectContext } from "./context.js";
import { attrsOf } from "./simple.js";

/** The focusable button. Toggles the popover and owns keyboard handling. */
export const Trigger = defineComponent({
  name: "SelectTrigger",
  setup(_props, { slots }) {
    const context = useSelectContext("Trigger");
    const { machine } = context;
    return () => {
      context.version.value;
      const attrs = machine.attrs.trigger();
      return h(
        "button",
        {
          type: "button",
          "data-part": "trigger",
          ...attrsOf(attrs),
          disabled: attrs["aria-disabled"] === "true",
          ref: context.triggerEl,
          onClick: () => {
            machine.toggle();
            if (machine.store.get().mode === "combobox") {
              context.focusField();
            }
          },
          onKeydown: (event: KeyboardEvent) => {
            const result = machine.onTriggerKeyDown({
              key: event.key,
              altKey: event.altKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
              shiftKey: event.shiftKey,
              isComposing: event.isComposing,
            });
            if (result.preventDefault) {
              event.preventDefault();
            }
          },
          onKeyup: (event: KeyboardEvent) => {
            // Space activates a button on keyup; the machine already handled keydown.
            if (event.key === " ") {
              event.preventDefault();
            }
          },
        },
        slots.default?.(),
      );
    };
  },
});
