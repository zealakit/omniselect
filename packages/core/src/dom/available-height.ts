import type { Placement, Rect } from "@zealakit/ui-engine/position";

/**
 * Candidate A.10 `available-height` — private (D27), do not export from a
 * published package.
 *
 * The engine's `/position` ships no `size` middleware (D11), so a package that
 * needs "how much room is left on the resolved side" computes it from the
 * `computePosition` result plus the viewport height it already measured.
 *
 * Rules (D35): zero dependencies, pure, no DOM at import, no page-global state.
 *
 * @param result The `computePosition` result whose `placement` has been resolved.
 * @param viewportHeight The clipping viewport's height (`innerHeight`).
 * @param options The gap between anchor and popover, and the padding kept from
 *   the clipping edge.
 * @returns The available height in pixels, never negative.
 */
export function availableHeight(
  result: {
    readonly placement: Placement;
    readonly rects: { readonly reference: Rect; readonly floating: Rect };
  },
  viewportHeight: number,
  options: { gap?: number; padding?: number } = {},
): number {
  const gap = options.gap ?? 4;
  const padding = options.padding ?? 8;
  const side = result.placement.split("-")[0];
  const reference = result.rects.reference;

  // The engine's Rect is `{ x, y, width, height }` (no `top`/`bottom`).
  const referenceBottom = reference.y + reference.height;
  if (side === "top") {
    return Math.max(0, Math.round(reference.y - gap - padding));
  }
  if (side === "bottom") {
    return Math.max(0, Math.round(viewportHeight - referenceBottom - gap - padding));
  }
  // A left/right popover grows beside the anchor: its height is the viewport's.
  return Math.max(0, Math.round(viewportHeight - padding * 2));
}
