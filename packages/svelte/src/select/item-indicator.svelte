<script lang="ts">
  import { getContext, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getSelectContext, ITEM_KEY } from "./context.js";

  type Props = HTMLAttributes<HTMLSpanElement> & {
    /** Keep mounted while unselected (for animated checkmarks). */
    forceMount?: boolean;
    children?: Snippet;
  };
  let { forceMount = false, children, ...rest }: Props = $props();
  const { machine, snapshot } = getSelectContext("ItemIndicator");
  const item = getContext<{ key: () => string } | undefined>(ITEM_KEY);
  if (!item) {
    throw new Error("Select.ItemIndicator must be rendered inside Select.Item.");
  }
  const selected = $derived.by(() => {
    void $snapshot;
    return machine.isSelected(item.key());
  });
</script>

{#if selected || forceMount}
  <span
    data-part="item-indicator"
    {...rest}
    aria-hidden="true"
    data-state={selected ? "checked" : "unchecked"}>{@render children?.()}</span
  >
{/if}
