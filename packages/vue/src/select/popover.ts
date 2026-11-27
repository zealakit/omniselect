import { availableHeight } from "@zealakit/omniselect-core/dom";
import { waitForExit } from "@zealakit/ui-engine/presence";
import { createLayer, type LayerHandle } from "@zealakit/ui-engine";
import { autoUpdate, computePosition, type PositionResult } from "@zealakit/ui-engine/position";
import { computed, defineComponent, h, nextTick, ref, shallowRef, Teleport, watch } from "vue";
import { useSelectContext } from "./context.js";

/**
 * Floating surface on the engine (X4: engine-direct, no overlay).
 *
 * `computePosition` + `autoUpdate` place it, a non-modal `createLayer` dismisses
 * it, and `Teleport` portals it. No focus scope: DOM focus stays on the trigger
 * or search input and the active option is `aria-activedescendant`.
 */
export const Popover = defineComponent({
  name: "SelectPopover",
  props: { forceMount: { type: Boolean, default: false } },
  setup(props, { slots }) {
    const context = useSelectContext("Popover");
    const { machine } = context;
    const element = shallowRef<HTMLElement | null>(null);
    const position = shallowRef<PositionResult | null>(null);
    const open = computed(() => {
      context.version.value;
      return machine.isOpen();
    });
    const mounted = ref(machine.isOpen());
    const anchor = computed(() => context.controlEl.value ?? context.triggerEl.value);

    let layer: LayerHandle | null = null;
    let stopAutoUpdate: (() => void) | null = null;
    const teardown = (): void => {
      layer?.release();
      layer = null;
      stopAutoUpdate?.();
      stopAutoUpdate = null;
    };

    watch(
      open,
      (isOpen) => {
        if (isOpen) {
          mounted.value = true;
          return;
        }
        teardown();
        void nextTick().then(() => {
          const el = element.value;
          if (!el) {
            mounted.value = false;
            return;
          }
          const animations = typeof el.getAnimations === "function" ? el.getAnimations() : [];
          if (animations.length === 0) {
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

    // One watch owns positioning and dismissal, and tears both down on close or
    // unmount, so a remount never leaves a second layer (NP1/NP4).
    watch(
      [open, element, anchor],
      ([isOpen, el, reference]) => {
        teardown();
        if (!isOpen || el === null || reference === null) {
          return;
        }
        const update = (): void => {
          position.value = computePosition(reference, el, {
            placement: context.props.placement,
            offset: context.props.offset,
            flip: true,
            shift: true,
            strategy: "fixed",
          });
        };
        update();
        stopAutoUpdate = autoUpdate(reference, el, update);
        layer = createLayer({
          element: el,
          inside: [context.controlEl.value, context.triggerEl.value],
          dismiss: { escapeKey: true, outsidePress: true },
          onDismiss: (reason) => {
            if (reason === "escape-key" || reason === "outside-press") {
              machine.close(reason === "escape-key" ? "escape" : "outside");
            }
          },
        });
      },
      { flush: "post", immediate: true },
    );

    return () => {
      if (!mounted.value && !props.forceMount) {
        return null;
      }
      const result = position.value;
      const [side = "bottom", align = "center"] = (
        result?.placement ?? context.props.placement
      ).split("-");
      const room =
        result === null
          ? null
          : availableHeight(result, window.innerHeight, { gap: context.props.offset });
      const style: Record<string, string | number | undefined> = {
        position: "fixed",
        left: `${result?.x ?? 0}px`,
        top: `${result?.y ?? 0}px`,
        "--omniselect-anchor-width":
          context.props.matchWidth && result ? `${result.rects.reference.width}px` : undefined,
        "--omniselect-available-height": room === null ? undefined : `${room}px`,
      };
      const content = h(
        "div",
        {
          "data-part": "popover",
          ref: element,
          // Keep focus on the trigger/input (also when grabbing the scrollbar).
          onMousedown: (event: Event) => event.preventDefault(),
          hidden: !mounted.value && !open.value,
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
