<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
let { children, ...rest }: Props = $props();
const context = getSelectContext("Control");
const { machine, snapshot } = context;
let element: HTMLDivElement | undefined = $state();
const attrs = $derived.by(() => {
  void $snapshot;
  return machine.attrs.root();
});

$effect(() => {
  context.setControlEl(element ?? null);
  return () => context.setControlEl(null);
});
</script>

<div data-part="control" {...rest} {...attrs} bind:this={element}>{@render children?.()}</div>
