export type PopoverVars = {
  /** Anchor width in pixels (for `matchWidth`). */
  width: number;
  /** Room left between the anchor and the viewport edge on the popover's side. */
  availableHeight: number;
};

/**
 * Values for `--omniselect-anchor-width` and `--omniselect-available-height`.
 * `placement` is the resolved placement (`bottom-start`, `top`, ...).
 */
export function getPopoverVars(
  anchor: { top: number; bottom: number; width: number },
  placement: string,
  viewportHeight: number,
  gap = 0,
  padding = 8,
): PopoverVars {
  const side = placement.split("-")[0];
  const room =
    side === "top"
      ? anchor.top - gap - padding
      : viewportHeight - anchor.bottom - gap - padding;
  return {
    width: anchor.width,
    availableHeight: Math.max(0, Math.round(room)),
  };
}
