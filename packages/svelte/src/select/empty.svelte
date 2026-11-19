<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
let { children, ...rest }: Props = $props();
const { machine, snapshot } = getSelectContext("Empty");
const isEmpty = $derived.by(() => {
  void $snapshot;
  return machine.collection.visible().length === 0;
});
</script>

{#if isEmpty}
  <div data-part="empty" {...rest} role="presentation">{@render children?.()}</div>
{/if}
