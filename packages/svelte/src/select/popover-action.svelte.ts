import { withoutUndefined } from "@zealakit/omniselect-core";
import { createLayer, type LayerHandle } from "@zealakit/ui-engine";
import {
  autoUpdate,
  computePosition,
  type Placement,
  type PositionResult,
  type PositionOptions,
} from "@zealakit/ui-engine/position";

/**
 * Svelte action that floats a node on the engine (X4: engine-direct).
 *
 * `computePosition` + `autoUpdate` place it, a non-modal `createLayer` dismisses
 * it, and a newer `update` replaces the previous session, so a component that
 * re-renders never leaves a second layer behind (NP1/NP4).
 */

export type EnginePopoverDismissReason = "escape-key" | "outside-press";

export type EnginePopoverParams = {
  /** The anchor element (control or trigger). */
  reference: HTMLElement | null | undefined;
  /** Whether the popover should be floating right now. */
  open: boolean;
  placement: Placement;
  offset?: number;
  /** Elements that count as inside for outside-press detection. */
  inside?: readonly (HTMLElement | null | undefined)[];
  onDismiss: (reason: EnginePopoverDismissReason) => void;
  /** Called with every computed position so the caller can mirror it into state. */
  onUpdate?: (result: PositionResult) => void;
  /** Engine layer to register as the parent, when the select sits inside one. */
  parent?: LayerHandle | null;
};

/** Svelte action entry point. */
export function enginePopover(node: HTMLElement, params: EnginePopoverParams) {
  let current = params;
  let layer: LayerHandle | null = null;
  let stopAutoUpdate: (() => void) | null = null;

  const position = (): void => {
    if (current.reference === undefined || current.reference === null) {
      return;
    }
    current.onUpdate?.(
      computePosition(
        current.reference,
        node,
        withoutUndefined<PositionOptions>({
          placement: current.placement,
          offset: current.offset,
          flip: true,
          shift: true,
          strategy: "fixed",
        }),
      ),
    );
  };

  const stop = (): void => {
    layer?.release();
    layer = null;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  };

  const start = (): void => {
    if (current.reference === undefined || current.reference === null) {
      return;
    }
    position();
    stopAutoUpdate = autoUpdate(current.reference, node, position);
    layer = createLayer({
      element: node,
      inside: (current.inside ?? []).filter(
        (element): element is HTMLElement => element !== undefined && element !== null,
      ),
      parent: current.parent ?? null,
      dismiss: { escapeKey: true, outsidePress: true },
      onDismiss: (reason) => {
        if (reason === "escape-key" || reason === "outside-press") {
          current.onDismiss(reason);
        }
      },
    });
  };

  if (params.open) {
    start();
  }

  return {
    update(next: EnginePopoverParams): void {
      const wasOpen = current.open;
      current = next;
      if (next.open && !wasOpen) {
        start();
        return;
      }
      if (!next.open && wasOpen) {
        stop();
        return;
      }
      if (next.open) {
        // Placement or anchor changed while open: re-measure once.
        position();
      }
    },
    destroy(): void {
      stop();
    },
  };
}
