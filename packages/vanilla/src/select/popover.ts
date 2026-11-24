import { createLayer, type LayerHandle } from "@zealakit/ui-engine";
import { autoUpdate, computePosition, type Placement } from "@zealakit/ui-engine/position";
import { availableHeight, waitForExit } from "@zealakit/omniselect-core/dom";

/**
 * Private popover controller on the engine (X4: engine-direct, no overlay).
 *
 * The listbox is neither modal nor focus-trapping: DOM focus stays on the
 * trigger or the search input and the active option is exposed with
 * `aria-activedescendant`, so this controller only owns positioning, the portal
 * and dismissal.
 */

export type PopoverDismissReason = "escape-key" | "outside-press";

export type PopoverControllerOptions = {
  /** The element the popover is positioned against (control or trigger). */
  anchor: HTMLElement;
  /** The floating panel. */
  popover: HTMLElement;
  placement: Placement;
  offset?: number;
  matchWidth?: boolean;
  /** Where to move the popover while open; `null` keeps it in place. */
  portal: Element | null;
  /** Elements that count as "inside" for outside-press detection. */
  inside: readonly (HTMLElement | null)[];
  /** Engine layer to register as the parent, when the select sits inside one. */
  parent?: () => LayerHandle | null;
  onDismiss: (reason: PopoverDismissReason) => void;
};

export type PopoverController = {
  readonly isOpen: boolean;
  readonly placement: Placement;
  open(): void;
  close(): void;
  /** Re-measure and reposition (used after a controlled open). */
  update(): void;
  destroy(): void;
};

type PortalState = {
  parent: Node;
  next: Node | null;
};

function moveToPortal(element: HTMLElement, container: Element): PortalState {
  const state: PortalState = { parent: element.parentNode ?? container, next: element.nextSibling };
  container.append(element);
  return state;
}

function restoreFromPortal(element: HTMLElement, state: PortalState | null): void {
  if (state === null || state.parent === element.parentNode) {
    return;
  }
  state.parent.insertBefore(element, state.next);
}

/**
 * Create the controller. `open()` registers an engine layer and starts
 * `autoUpdate`; `close()` releases both and waits for the exit animation.
 *
 * @param options The anchor, panel, placement and dismissal callback.
 * @returns The controller.
 */
export function createPopoverController(options: PopoverControllerOptions): PopoverController {
  let layer: LayerHandle | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let portalState: PortalState | null = null;
  let open = false;
  let destroyed = false;
  let placement = options.placement;

  // Closed is the initial state: the panel is `hidden` until `open()`.
  options.popover.hidden = true;

  const measure = (): void => {
    const result = computePosition(options.anchor, options.popover, {
      placement: options.placement,
      offset: options.offset ?? 4,
      flip: true,
      shift: true,
      strategy: "fixed",
    });
    placement = result.placement;
    const style = options.popover.style;
    style.setProperty("left", `${result.x}px`);
    style.setProperty("top", `${result.y}px`);
    const [side = "bottom", align = "center"] = result.placement.split("-");
    options.popover.dataset.side = side;
    options.popover.dataset.align = align;
    if (options.matchWidth !== false) {
      style.setProperty("--omniselect-anchor-width", `${result.rects.reference.width}px`);
    }
    const reference = result.rects.reference;
    const viewportHeight =
      typeof window !== "undefined" && typeof window.innerHeight === "number"
        ? window.innerHeight
        : reference.y + reference.height;
    const room = availableHeight(result, viewportHeight, { gap: options.offset ?? 4 });
    style.setProperty("--omniselect-available-height", `${room}px`);
  };

  const close = (): void => {
    if (!open) {
      return;
    }
    open = false;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    layer?.release();
    layer = null;
    const panel = options.popover;
    const finish = (): void => {
      if (open) {
        return;
      }
      panel.hidden = true;
      restoreFromPortal(panel, portalState);
      portalState = null;
    };
    // No running animation (the common case, and the test environment): finish
    // synchronously so "closed means hidden" holds in the same tick.
    const animations = typeof panel.getAnimations === "function" ? panel.getAnimations() : [];
    if (animations.length === 0) {
      finish();
      return;
    }
    void waitForExit(panel).then(finish);
  };

  return {
    get isOpen() {
      return open;
    },
    get placement() {
      return placement;
    },
    open(): void {
      if (open || destroyed) {
        return;
      }
      open = true;
      portalState = options.portal === null ? null : moveToPortal(options.popover, options.portal);
      options.popover.hidden = false;
      measure();
      layer = createLayer({
        element: options.popover,
        inside: options.inside.filter((element): element is HTMLElement => element !== null),
        parent: options.parent?.() ?? null,
        dismiss: { escapeKey: true, outsidePress: true },
        onDismiss: (reason) => {
          if (reason === "escape-key" || reason === "outside-press") {
            options.onDismiss(reason);
          }
        },
      });
      stopAutoUpdate = autoUpdate(options.anchor, options.popover, measure);
    },
    close,
    update(): void {
      if (open) {
        measure();
      }
    },
    destroy(): void {
      if (destroyed) {
        return;
      }
      close();
      destroyed = true;
      restoreFromPortal(options.popover, portalState);
      portalState = null;
    },
  };
}
