import { checkStructure, getItemText, scrollItemIntoView } from "@zealakit/omniselect-core";
import {
  Comment,
  computed,
  defineComponent,
  h,
  Text,
  type VNode,
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
/** Plain text of rendered slot content (strings only). */
function vnodeText(nodes: VNode[] | undefined): string {
  if (!nodes) {
    return "";
  }
  return nodes
    .map((node) => {
      if (node.type === Comment) {
        return "";
      }
      if (typeof node.children === "string") {
        return node.children;
      }
      return Array.isArray(node.children) ? vnodeText(node.children as VNode[]) : "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
void Text;

export const Item = defineComponent({
  name: "SelectItem",
  props: {
    value: { type: null as unknown as PropType<unknown>, required: true },
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
    let fallbackText = "";
    let off: (() => void) | undefined;
    const register = () => {
      off?.();
      off = machine.collection.register({
        key: key(),
        value: props.value,
        textValue: props.textValue ?? (getItemText(element.value) || fallbackText),
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
    // Back from a filter: the element is new, so refresh the DOM-order node.
    watch(
      () => element.value,
      (node) => {
        if (node && machine.collection.get(key())?.node !== node) {
          machine.collection.update(key(), { node });
        }
      },
      { flush: "post" },
    );
    onBeforeUnmount(() => off?.());

    // A computed only notifies dependents when its value changes, so a highlight move
    // re-renders the two affected items instead of all of them.
    const stateKey = computed(() => {
      context.version.value;
      const state = machine.store.get();
      const highlighted = state.highlightedKey === key();
      return [
        machine.isSelected(key()),
        highlighted,
        highlighted ? state.highlightSource : "",
        machine.collection.get(key())?.disabled,
        machine.maxReached(),
        machine.collection.isVisible(key()),
      ].join("|");
    });

    return () => {
      void stateKey.value;
      const content = slots.default?.();
      fallbackText = vnodeText(content);
      if (!machine.collection.isVisible(key()) && machine.collection.get(key())) {
        // Filtered out: stay registered, render nothing.
        // Drop the stale node once (updating on every render would loop).
        if (machine.collection.get(key())?.node) {
          queueMicrotask(() => machine.collection.update(key(), { node: null }));
        }
        return null;
      }
      const attrs = machine.attrs.item(key());
      const state = machine.store.get();
      if (state.highlightedKey === key() && state.highlightSource === "keyboard") {
        queueMicrotask(() => (element.value ? scrollItemIntoView(element.value) : undefined));
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
        content,
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
      throw new Error("Select.ItemIndicator must be rendered inside Select.Item.");
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
