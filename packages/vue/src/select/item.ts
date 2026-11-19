// biome-ignore-all lint/suspicious/noExplicitAny: values are user-defined
import { checkStructure } from "@zealakit/omniselect-core";
import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  ref,
  watch,
} from "vue";
import { groupKey, itemKey, useSelectContext } from "./context.js";
import { attrsOf } from "./simple.js";

/** One option. Registers with the Root; exposes `data-highlighted`, `data-selected`, `data-disabled`. */
export const Item = defineComponent({
  name: "SelectItem",
  props: {
    value: { type: null as unknown as PropType<any>, required: true },
    disabled: { type: Boolean, default: false },
    textValue: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const context = useSelectContext("Item");
    const { machine } = context;
    const group = inject(groupKey, null);
    const element = ref<HTMLElement | null>(null);
    const key = () => machine.itemToKey(props.value);
    provide(itemKey, { key });
    let off: (() => void) | undefined;
    const register = () => {
      off?.();
      off = machine.collection.register({
        key: key(),
        value: props.value,
        textValue: props.textValue ?? element.value?.textContent?.trim() ?? "",
        disabled: props.disabled,
        groupId: group?.groupId ?? null,
        node: element.value,
      });
    };
    onMounted(() => {
      checkStructure("Item", element.value);
      register();
    });
    watch([key, () => props.disabled, () => props.textValue], register, {
      flush: "post",
    });
    onBeforeUnmount(() => off?.());

    return () => {
      context.version.value;
      const attrs = machine.attrs.item(key());
      const state = machine.store.get();
      if (
        state.highlightedKey === key() &&
        state.highlightSource === "keyboard"
      ) {
        queueMicrotask(() =>
          element.value?.scrollIntoView?.({ block: "nearest" }),
        );
      }
      return h(
        "div",
        {
          "data-part": "item",
          ...attrsOf(attrs),
          ref: element,
          onPointerdown: (event: Event) => event.preventDefault(),
          onPointermove: (event: PointerEvent) => {
            if (event.pointerType !== "touch") {
              machine.highlight(key(), "pointer");
            }
          },
          onClick: () => machine.selectKey(key()),
        },
        slots.default?.(),
      );
    };
  },
});

/** Renders only while its Item is selected. */
export const ItemIndicator = defineComponent({
  name: "SelectItemIndicator",
  props: { forceMount: { type: Boolean, default: false } },
  setup(props, { slots }) {
    const { machine, version } = useSelectContext("ItemIndicator");
    const item = inject(itemKey, null);
    if (!item) {
      throw new Error(
        "Select.ItemIndicator must be rendered inside Select.Item.",
      );
    }
    return () => {
      version.value;
      const selected = machine.isSelected(item.key());
      if (!selected && !props.forceMount) {
        return null;
      }
      return h(
        "span",
        {
          "data-part": "item-indicator",
          "aria-hidden": "true",
          "data-state": selected ? "checked" : "unchecked",
        },
        slots.default?.(),
      );
    };
  },
});
