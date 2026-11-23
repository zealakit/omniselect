import { getPopoverVars, waitForExit, type SelectCloseReason } from "@zealakit/omniselect-core";
import { type DismissReason, Portal, useLayer, usePositioner } from "@zealakit/overlay-react";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectPopoverProps = HTMLAttributes<HTMLDivElement> & {
  /** Keep the element in the DOM (hidden) while closed. */
  forceMount?: boolean;
};

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
  const anchor = controlEl ?? triggerEl;

  const positioner = usePositioner({
    reference: anchor,
    placement: context.placement,
    offset: context.offset,
    flip: true,
    shift: true,
  });

  const boundaries = useMemo(() => [controlEl], [controlEl]);
  const onDismiss = useCallback(
    (reason: DismissReason) => machine.close(dismissReasons[reason]),
    [machine],
  );
  useLayer({
    element,
    reference: triggerEl,
    boundaries,
    dismissOnEscape: true,
    dismissOnOutsidePress: true,
    disabled: !open || element === null,
    onDismiss,
  });

  useEffect(() => {
    if (open || !mounted) {
      return;
    }
    if (!element) {
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

  const [vars, setVars] = useState<{
    width: number;
    availableHeight: number;
  } | null>(null);
  const result = positioner.result;
  useIsomorphicLayoutEffect(() => {
    if (open && anchor && result) {
      const rect = anchor.getBoundingClientRect();
      const next = getPopoverVars(rect, result.placement, window.innerHeight, context.offset);
      setVars((prev) =>
        prev && prev.width === next.width && prev.availableHeight === next.availableHeight
          ? prev
          : next,
      );
    }
  }, [open, anchor, result, context.offset]);

  const floatingRef = useRef(positioner.floatingRef);
  floatingRef.current = positioner.floatingRef;
  const setRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
    floatingRef.current(node);
  }, []);
  const mergedRef = useMergedRef(ref, setRef);

  if (!mounted && !forceMount) {
    return null;
  }

  const [side = "bottom", align = "center"] = (result?.placement ?? context.placement).split("-");
  const merged: CSSProperties & Record<string, string | number | undefined> = {
    ...style,
    position: result?.strategy ?? "absolute",
    left: result?.x ?? 0,
    top: result?.y ?? 0,
    "--omniselect-anchor-width": context.matchWidth && vars ? `${vars.width}px` : undefined,
    "--omniselect-available-height": vars ? `${vars.availableHeight}px` : undefined,
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
      hidden={!open && !mounted}
      data-state={open ? "open" : "closed"}
      data-side={side}
      data-align={align}
      style={merged}
    />
  );
  if (context.portal === false) {
    return content;
  }
  return (
    <Portal container={context.portal === true ? undefined : context.portal}>{content}</Portal>
  );
});
