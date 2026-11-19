import { defineComponent, h } from "vue";
import { useSelectContext } from "./context.js";

const attrsOf = (
  attrs: Record<string, string | undefined>,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      out[name] = value;
    }
  }
  return out;
};
export { attrsOf };

/** Accessible name. The trigger references it with `aria-labelledby`. */
export const Label = defineComponent({
  name: "SelectLabel",
  setup(_props, { slots }) {
    const { machine } = useSelectContext("Label");
    return () =>
      h(
        "span",
        { "data-part": "label", id: machine.ids.label },
        slots.default?.(),
      );
  },
});

/** Wrapper that groups trigger, clear, and indicator. The popover anchors to it. */
export const Control = defineComponent({
  name: "SelectControl",
  setup(_props, { slots }) {
    const context = useSelectContext("Control");
    return () => {
      context.version.value;
      return h(
        "div",
        {
          "data-part": "control",
          ref: context.controlEl,
          ...attrsOf(context.machine.attrs.root()),
        },
        slots.default?.(),
      );
    };
  },
});

/** Decorative icon slot. `data-state` is `open` or `closed`. */
export const Indicator = defineComponent({
  name: "SelectIndicator",
  setup(_props, { slots }) {
    const { machine, version } = useSelectContext("Indicator");
    return () => {
      version.value;
      return h(
        "span",
        {
          "data-part": "indicator",
          "aria-hidden": "true",
          "data-state": machine.isOpen() ? "open" : "closed",
        },
        slots.default?.(),
      );
    };
  },
});

/** The listbox. Items, groups, Empty, and LoadMore go inside. */
export const List = defineComponent({
  name: "SelectList",
  setup(_props, { slots }) {
    const { machine, version } = useSelectContext("List");
    return () => {
      version.value;
      return h(
        "div",
        { "data-part": "list", ...attrsOf(machine.attrs.list()) },
        slots.default?.(),
      );
    };
  },
});

/** Rendered while the visible collection is empty. */
export const Empty = defineComponent({
  name: "SelectEmpty",
  setup(_props, { slots }) {
    const { machine, version } = useSelectContext("Empty");
    return () => {
      version.value;
      if (machine.collection.visible().length !== 0) {
        return null;
      }
      return h(
        "div",
        { "data-part": "empty", role: "presentation" },
        slots.default?.(),
      );
    };
  },
});
