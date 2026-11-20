/**
 * Plain label of an item element: its text without decorative parts
 * (`aria-hidden` descendants such as `Select.ItemIndicator`).
 */
export function getItemText(element: Element | null | undefined): string {
  if (!element) {
    return "";
  }
  const clone = element.cloneNode(true) as Element;
  for (const hidden of Array.from(
    clone.querySelectorAll(
      '[aria-hidden="true"], [data-part="item-indicator"]',
    ),
  )) {
    hidden.remove();
  }
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}
