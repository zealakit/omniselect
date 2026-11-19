<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Shown while nothing is selected. */
  placeholder?: string;
  /** Custom rendering; receives `{ labels, isPlaceholder }`. */
  children?: Snippet<[{ labels: string[]; isPlaceholder: boolean }]>;
};
let { placeholder, children, ...rest }: Props = $props();
const { machine, snapshot } = getSelectContext("Value");
const labels = $derived.by(() => {
  void $snapshot;
  return machine.selectedLabels();
});
const isPlaceholder = $derived(labels.length === 0);
</script>

<span data-part="value" data-placeholder={isPlaceholder ? "" : undefined} {...rest}
  >{#if children}{@render children({ labels, isPlaceholder })}{:else if isPlaceholder}{placeholder ?? ""}{:else}{labels.join(", ")}{/if}</span
>
