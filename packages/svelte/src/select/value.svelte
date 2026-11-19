<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type ValueInfo = {
  /** Labels of the selected value(s), in selection order. */
  labels: string[];
  isPlaceholder: boolean;
  /** Selected values with their keys and labels (render chips from these). */
  items: { value: unknown; key: string; label: string }[];
  /** Remove one selected value (multiple mode). */
  remove: (value: unknown) => void;
  /** Clear the selection. */
  clear: () => void;
};

type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Shown while nothing is selected. */
  placeholder?: string;
  /** Custom rendering; receives the selected items and helpers. */
  children?: Snippet<[ValueInfo]>;
};
let { placeholder, children, ...rest }: Props = $props();
const { machine, snapshot } = getSelectContext("Value");
const labels = $derived.by(() => {
  void $snapshot;
  return machine.selectedLabels();
});
const items = $derived.by(() => {
  void $snapshot;
  return machine.selectedItems();
});
const isPlaceholder = $derived(labels.length === 0);
const info = $derived<ValueInfo>({
  labels,
  isPlaceholder,
  items,
  remove: (value) => machine.removeKey(machine.itemToKey(value)),
  clear: () => machine.clear(),
});
</script>

<span data-part="value" data-placeholder={isPlaceholder ? "" : undefined} {...rest}
  >{#if children}{@render children(info)}{:else if isPlaceholder}{placeholder ?? ""}{:else}{labels.join(", ")}{/if}</span
>
