import { nextId } from "@zealakit/omniselect-core";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  inject,
  watch,
} from "vue";
import { groupKey, useSelectContext } from "./context.js";
import { attrsOf } from "./simple.js";

/** Semantic option group. Labelled by `Select.GroupLabel`. */
export const Group = defineComponent({
  name: "SelectGroup",
  props: { disabled: { type: Boolean, default: false } },
  setup(props, { slots }) {
    const context = useSelectContext("Group");
    const { machine } = context;
    const groupId = nextId("group");
    const hasLabel = ref(false);
    provide(groupKey, { groupId, hasLabel });
    let off: (() => void) | undefined;
    const register = () => {
      off?.();
      off = machine.collection.registerGroup(groupId, {
        disabled: props.disabled,
      });
    };
    onMounted(register);
    watch(() => props.disabled, register);
    onBeforeUnmount(() => off?.());
    return () => {
      context.version.value;
      return h(
        "div",
        {
          "data-part": "group",
          "data-disabled": props.disabled ? "" : undefined,
          hidden: !machine.collection.groupHasVisible(groupId),
          ...attrsOf(machine.attrs.group(groupId, hasLabel.value)),
        },
        slots.default?.(),
      );
    };
  },
});

/** Visible name of a group. */
export const GroupLabel = defineComponent({
  name: "SelectGroupLabel",
  setup(_props, { slots }) {
    const { machine } = useSelectContext("GroupLabel");
    const group = inject(groupKey, null);
    if (!group) {
      throw new Error(
        "Select.GroupLabel must be rendered inside Select.Group.",
      );
    }
    onMounted(() => {
      group.hasLabel.value = true;
    });
    onBeforeUnmount(() => {
      group.hasLabel.value = false;
    });
    return () =>
      h(
        "div",
        {
          "data-part": "group-label",
          ...attrsOf(machine.attrs.groupLabel(group.groupId)),
        },
        slots.default?.(),
      );
  },
});
