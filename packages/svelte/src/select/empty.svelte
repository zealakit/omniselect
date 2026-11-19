<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
let { children, ...rest }: Props = $props();
const { machine, snapshot } = getSelectContext("Empty");
const isEmpty = $derived.by(() => {
  void $snapshot;
  // While a page is loading the list is not empty yet.
  return (
    machine.collection.visible().length === 0 && !machine.store.get().hasLoading
  );
});
</script>

{#if isEmpty}
  <div data-part="empty" {...rest} role="option" aria-disabled="true" aria-selected="false">{@render children?.()}</div>
{/if}
