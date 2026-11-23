import { devWarn } from "./utils/dev-warn.js";

/**
 * Dev-only checks for compound-part placement. They run after mount, so they
 * can inspect the real DOM, and are silent in production.
 */
export function checkStructure(
  part: "Clear" | "Indicator" | "Item" | "Group" | "Empty",
  element: Element | null | undefined,
): void {
  if (!element || typeof element.closest !== "function") {
    return;
  }
  if ((part === "Clear" || part === "Indicator") && element.closest('[data-part="trigger"]')) {
    devWarn(
      `Select.${part} is inside Select.Trigger. Interactive or decorative siblings belong beside the Trigger inside Select.Control (a button cannot contain another button).`,
    );
  }
  if (
    (part === "Item" || part === "Group" || part === "Empty") &&
    !element.closest('[role="listbox"]')
  ) {
    devWarn(`Select.${part} must be rendered inside Select.List.`);
  }
}
