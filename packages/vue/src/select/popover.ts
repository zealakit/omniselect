import { getPopoverVars, type SelectCloseReason, waitForExit } from "@zealakit/omniselect-core";
import { type DismissReason, useLayer, usePositioner } from "@zealakit/overlay-vue";
import { computed, defineComponent, h, nextTick, ref, shallowRef, Teleport, watch } from "vue";
import { useSelectContext } from "./context.js";

const dismissReasons: Record<DismissReason, SelectCloseReason> = {
  "escape-key": "escape",
  "outside-press": "outside",
  "reference-press": "toggle",
  imperative: "imperative",
};

/**
 * Floating surface. Positioned against the Control (or Trigger), dismissed by
 * Escape and outside presses through Overlay's shared layer stack, and kept
 * mounted until CSS exit animations finish.
 */
export const Popover = defineComponent({
  name: "SelectPopover",
  props: { forceMount: { type: Boolean, default: false } },
  setup(props, { slots }) {
    const context = useSelectContext("Popover");
    const { machine } = context;
    const element = shallowRef<HTMLElement | null>(null);
    const open = computed(() => {
      context.version.value;
      return machine.isOpen();
    });
    const mounted = ref(machine.isOpen());
    watch(
      open,
      (isOpen) => {
        if (isOpen) {
          mounted.value = true;
          return;
        }
        void nextTick().then(() => {
          const el = element.value;
          if (!el) {
            mounted.value = false;
            return;
          }
          void waitForExit(el).then(() => {
            if (!machine.isOpen()) {
              mounted.value = false;
            }
          });
        });
      },
      { flush: "post" },
    );

    const anchor = computed(() => context.controlEl.value ?? context.triggerEl.value);
    const positioner = usePositioner({
      reference: anchor,
      floating: element,
      placement: () => context.props.placement,
      offset: () => context.props.offset,
      flip: true,
      shift: true,
    });
    useLayer({
      element,
      reference: context.triggerEl,
      boundaries: () => [context.controlEl.value],
      dismissOnEscape: true,
      dismissOnOutsidePress: true,
      disabled: () => !open.value || element.value === null,
      onDismiss: (reason) => machine.close(dismissReasons[reason]),
    });

    return () => {
      if (!mounted.value && !props.forceMount) {
        return null;
      }
      const result = positioner.result.value;
      const [side = "bottom", align = "center"] = (
        result?.placement ?? context.props.placement
      ).split("-");
      const rect = open.value ? anchor.value?.getBoundingClientRect() : undefined;
      const vars =
        rect && result
          ? getPopoverVars(rect, result.placement, window.innerHeight, context.props.offset)
          : null;
      const style: Record<string, string | number | undefined> = {
        position: result?.strategy ?? "absolute",
        left: `${result?.x ?? 0}px`,
        top: `${result?.y ?? 0}px`,
        "--omniselect-anchor-width":
          context.props.matchWidth && vars ? `${vars.width}px` : undefined,
        "--omniselect-available-height": vars ? `${vars.availableHeight}px` : undefined,
      };
      const content = h(
        "div",
        {
          "data-part": "popover",
          ref: element,
          // Keep focus on the trigger/input (also when grabbing the scrollbar).
          onMousedown: (event: Event) => event.preventDefault(),
          hidden: !open.value && !mounted.value,
          "data-state": open.value ? "open" : "closed",
          "data-side": side,
          "data-align": align,
          style,
        },
        slots.default?.(),
      );
      const portal = context.props.portal;
      if (portal === false) {
        return content;
      }
      return h(Teleport, { to: portal === true ? "body" : (portal as string | Element) }, [
        content,
      ]);
    };
  },
});
