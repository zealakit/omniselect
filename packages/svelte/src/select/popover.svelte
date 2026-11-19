<script lang="ts">
import {
  getPopoverVars,
  type SelectCloseReason,
  waitForExit,
} from "@zealakit/omniselect-core";
import {
  type DismissReason,
  overlay,
  type PositionerResult,
} from "@zealakit/overlay-svelte";
import { portal as portalAction } from "./portal.js";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Keep the element in the DOM (hidden) while closed. */
  forceMount?: boolean;
  children?: Snippet;
};
let { forceMount = false, children, ...rest }: Props = $props();

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
let vars: { width: number; availableHeight: number } | null = $state(null);

const reasons: Record<DismissReason, SelectCloseReason> = {
  "escape-key": "escape",
  "outside-press": "outside",
  "reference-press": "toggle",
  imperative: "imperative",
};

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
  let cancelled = false;
  void waitForExit(node).then(() => {
    if (!cancelled && !machine.isOpen()) mounted = false;
  });
  return () => {
    cancelled = true;
  };
});

const anchor = $derived(context.controlEl ?? context.triggerEl);

function onUpdate(result: PositionerResult) {
  const [nextSide = "bottom", nextAlign = "center"] =
    result.placement.split("-");
  // Only write state when something changed, or the action's parameters would
  // be recreated and re-run the positioner endlessly.
  if (side !== nextSide) side = nextSide;
  if (align !== nextAlign) align = nextAlign;
  if (anchor) {
    const next = getPopoverVars(
      anchor.getBoundingClientRect(),
      result.placement,
      window.innerHeight,
      context.props.offset,
    );
    if (
      !vars ||
      vars.width !== next.width ||
      vars.availableHeight !== next.availableHeight
    ) {
      vars = next;
    }
  }
}
</script>

{#if mounted || forceMount}
  <div
    data-part="popover"
    {...rest}
    bind:this={element}
    hidden={!open && !mounted}
    data-state={open ? "open" : "closed"}
    data-side={side}
    data-align={align}
    style:--omniselect-anchor-width={context.props.matchWidth && vars ? `${vars.width}px` : undefined}
    style:--omniselect-available-height={vars ? `${vars.availableHeight}px` : undefined}
    use:portalAction={{
      disabled: context.props.portal === false,
      target: context.props.portal === true || context.props.portal === false ? undefined : context.props.portal,
    }}
    use:overlay={{
      reference: anchor,
      open,
      boundaries: [context.controlEl],
      placement: context.props.placement,
      offset: context.props.offset,
      flip: true,
      shift: true,
      dismissOnEscape: true,
      dismissOnOutsidePress: true,
      onDismiss: (reason) => machine.close(reasons[reason]),
      onUpdate,
    }}
  >
    {@render children?.()}
  </div>
{/if}
