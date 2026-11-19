/**
 * Keys a hidden native `<select>` should mark as selected, in selection order.
 * Each key becomes one `<option selected value=key>`, which is exactly what
 * `FormData` and constraint validation read.
 */
export function hiddenSelectKeys(keys: readonly string[]): string[] {
  return [...keys];
}

/** Inline style for the visually hidden (but validatable) form control. */
export const visuallyHiddenStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: "0",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: "0",
  pointerEvents: "none",
} as const;
