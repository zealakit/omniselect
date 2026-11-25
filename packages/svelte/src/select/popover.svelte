<script lang="ts">
  import { availableHeight } from "@zealakit/omniselect-core/dom";
  import { waitForExit } from "@zealakit/ui-engine/presence";
  import type { PositionResult } from "@zealakit/ui-engine/position";
  import { portal as portalAction } from "./portal.js";
  import { enginePopover } from "./popover-action.svelte.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = HTMLAttributes<HTMLDivElement> & {
    /** Keep the element in the DOM (hidden) while closed. */
    forceMount?: boolean;
    children?: Snippet;
  };
  let { forceMount = false, children, onmousedown, ...rest }: Props = $props();

  const context = getSelectContext("Popover");
  const { machine, snapshot } = context;
  const open = $derived.by(() => {
    void $snapshot;
    return machine.isOpen();
  });
  let mounted = $state(machine.isOpen());
  let element: HTMLDivElement | undefined = $state();
  let side = $state("bottom");
  let align = $state("center");
  let vars: { x: number; y: number; width: number; availableHeight: number } | null = $state(null);

  $effect(() => {
    if (open) {
      mounted = true;
      return;
    }
    if (!mounted) return;
    const node = element;
    if (!node) {
      mounted = false;
      return;
    }
    // No running animation: hide in the same tick, like the other adapters.
    const animations = typeof node.getAnimations === "function" ? node.getAnimations() : [];
    if (animations.length === 0) {
      mounted = false;
      return;
    }
    let cancelled = false;
    void waitForExit(node).then(() => {
      if (!cancelled && !machine.isOpen()) mounted = false;
    });
    return () => {
      cancelled = true;
    };
  });

  const anchor = $derived(context.controlEl ?? context.triggerEl);

  function onUpdate(result: PositionResult) {
    const [nextSide = "bottom", nextAlign = "center"] = result.placement.split("-");
    // Only write state when something changed, or the action's parameters would
    // be recreated and re-run the positioner endlessly.
    if (side !== nextSide) side = nextSide;
    if (align !== nextAlign) align = nextAlign;
    const room = availableHeight(result, window.innerHeight, { gap: context.props.offset });
    const next = {
      x: result.x,
      y: result.y,
      width: result.rects.reference.width,
      availableHeight: room,
    };
    if (
      !vars ||
      vars.x !== next.x ||
      vars.y !== next.y ||
      vars.width !== next.width ||
      vars.availableHeight !== next.availableHeight
    ) {
      vars = next;
    }
  }
</script>

{#if mounted || forceMount}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    data-part="popover"
    {...rest}
    bind:this={element}
    onmousedown={(event) => {
      (onmousedown as ((e: MouseEvent) => void) | undefined)?.(event as MouseEvent);
      // Keep focus on the trigger/input (also when grabbing the scrollbar).
      event.preventDefault();
    }}
    hidden={!open}
    data-state={open ? "open" : "closed"}
    data-side={side}
    data-align={align}
    style:position="fixed"
    style:left={vars ? `${vars.x}px` : undefined}
    style:top={vars ? `${vars.y}px` : undefined}
    style:--omniselect-anchor-width={context.props.matchWidth && vars
      ? `${vars.width}px`
      : undefined}
    style:--omniselect-available-height={vars ? `${vars.availableHeight}px` : undefined}
    use:portalAction={{
      disabled: context.props.portal === false,
      target:
        context.props.portal === true || context.props.portal === false
          ? null
          : (context.props.portal ?? null),
    }}
    use:enginePopover={{
      reference: anchor,
      open,
      inside: [context.controlEl, context.triggerEl],
      placement: context.props.placement,
      offset: context.props.offset,
      onUpdate,
      onDismiss: (reason) => machine.close(reason === "escape-key" ? "escape" : "outside"),
    }}
  >
    {@render children?.()}
  </div>
{/if}
