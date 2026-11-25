import { availableHeight } from "@zealakit/omniselect-core/dom";
import { waitForExit } from "@zealakit/ui-engine/presence";
import { createLayer, type LayerHandle } from "@zealakit/ui-engine";
import {
  autoUpdate,
  computePosition,
  type Placement,
  type PositionResult,
} from "@zealakit/ui-engine/position";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { useMergedRef } from "../internal/merge-refs.js";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectPopoverProps = HTMLAttributes<HTMLDivElement> & {
  /** Keep the element in the DOM (hidden) while closed. */
  forceMount?: boolean;
};

/**
 * Floating surface on the engine (X4: engine-direct, no overlay).
 *
 * Placement comes from `computePosition` + `autoUpdate` (`/position`), dismissal
 * from a non-modal `createLayer`, and the portal from `react-dom`. No focus
 * scope is needed: DOM focus stays on the trigger or the search input and the
 * active option is exposed with `aria-activedescendant`.
 */
export const Popover = forwardRef<HTMLDivElement, SelectPopoverProps>(function SelectPopover(
  { forceMount = false, style, ...rest },
  ref,
) {
  const context = useSelectContext("Popover");
  const { machine, triggerEl, controlEl } = context;
  const open = useSnapshot(machine, (m) => String(m.isOpen())) === "true";
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) {
    setMounted(true);
  }
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PositionResult | null>(null);
  const anchor = controlEl ?? triggerEl;

  // Position and dismissal share one effect so a double-invoked effect in React
  // strict mode leaves exactly one layer and one autoUpdate (NP1/NP4).
  useIsomorphicLayoutEffect(() => {
    if (!open || element === null || anchor === null) {
      return;
    }
    const update = (): void => {
      setPosition(
        computePosition(anchor, element, {
          placement: context.placement,
          offset: context.offset,
          flip: true,
          shift: true,
          strategy: "fixed",
        }),
      );
    };
    update();
    const stopAutoUpdate = autoUpdate(anchor, element, update);
    const layer: LayerHandle = createLayer({
      element,
      inside: [controlEl, triggerEl],
      dismiss: { escapeKey: true, outsidePress: true },
      onDismiss: (reason) => {
        if (reason === "escape-key" || reason === "outside-press") {
          machine.close(reason === "escape-key" ? "escape" : "outside");
        }
      },
    });
    return () => {
      layer.release();
      stopAutoUpdate();
    };
  }, [open, element, anchor, machine, context.placement, context.offset, controlEl, triggerEl]);

  useEffect(() => {
    if (open || !mounted) {
      return;
    }
    if (!element) {
      setMounted(false);
      return;
    }
    const animations = typeof element.getAnimations === "function" ? element.getAnimations() : [];
    if (animations.length === 0) {
      setMounted(false);
      return;
    }
    let cancelled = false;
    void waitForExit(element).then(() => {
      if (!cancelled) {
        setMounted(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, mounted, element]);

  const floatingRef = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback((node: HTMLDivElement | null) => {
    floatingRef.current = node;
    setElement(node);
  }, []);
  const mergedRef = useMergedRef(ref, setRef);

  if (!mounted && !forceMount) {
    return null;
  }

  const placement: Placement = position?.placement ?? context.placement;
  const [side = "bottom", align = "center"] = placement.split("-");
  const room =
    position === null
      ? null
      : availableHeight(position, window.innerHeight, { gap: context.offset });
  const merged: CSSProperties & Record<string, string | number | undefined> = {
    ...style,
    position: "fixed",
    left: position?.x ?? 0,
    top: position?.y ?? 0,
    "--omniselect-anchor-width":
      context.matchWidth && position ? `${position.rects.reference.width}px` : undefined,
    "--omniselect-available-height": room === null ? undefined : `${room}px`,
  };

  const content = (
    <div
      data-part="popover"
      {...rest}
      onMouseDown={(event) => {
        rest.onMouseDown?.(event);
        // Keep focus on the trigger/input (also when grabbing the scrollbar).
        event.preventDefault();
      }}
      ref={mergedRef}
      hidden={!open}
      data-state={open ? "open" : "closed"}
      data-side={side}
      data-align={align}
      style={merged}
    />
  );

  if (typeof document === "undefined" || context.portal === false) {
    return content;
  }
  return createPortal(
    content,
    context.portal === true ? document.body : (context.portal as Element),
    "omniselect-popover",
  );
});
