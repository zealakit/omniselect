<script lang="ts" generics="T">
import { getContext, setContext, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { checkStructure } from "@zealakit/omniselect-core";
import { getSelectContext, GROUP_KEY, ITEM_KEY } from "./context.js";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "onselect"> & {
  value: T;
  disabled?: boolean;
  /** Label used for the Value and type-ahead. Defaults to the item's text. */
  textValue?: string;
  children?: Snippet;
};
let {
  value,
  disabled = false,
  textValue,
  children,
  onclick,
  onpointermove,
  onpointerdown,
  ...rest
}: Props = $props();

const { machine, snapshot } = getSelectContext("Item");
const group = getContext<{ groupId: string } | undefined>(GROUP_KEY);
let element: HTMLDivElement | undefined = $state();
const key = $derived(machine.itemToKey(value));
setContext(ITEM_KEY, { key: () => key });

$effect(() => checkStructure("Item", element));

$effect(() => {
  const node = element;
  if (!node) return;
  return machine.collection.register({
    key,
    value,
    textValue: textValue ?? node.textContent?.trim() ?? "",
    disabled,
    groupId: group?.groupId ?? null,
    node,
  });
});

const attrs = $derived.by(() => {
  void $snapshot;
  return machine.attrs.item(key);
});
const keyboardHighlight = $derived.by(() => {
  void $snapshot;
  const state = machine.store.get();
  return state.highlightedKey === key && state.highlightSource === "keyboard";
});
$effect(() => {
  if (keyboardHighlight) element?.scrollIntoView?.({ block: "nearest" });
});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  data-part="item"
  {...rest}
  {...attrs}
  bind:this={element}
  onpointerdown={(event) => {
    (onpointerdown as ((e: PointerEvent) => void) | undefined)?.(event as PointerEvent);
    // Keep focus on the trigger/input.
    event.preventDefault();
  }}
  onpointermove={(event) => {
    (onpointermove as ((e: PointerEvent) => void) | undefined)?.(event as PointerEvent);
    if (event.pointerType !== "touch") machine.highlight(key, "pointer");
  }}
  onclick={(event) => {
    (onclick as ((e: MouseEvent) => void) | undefined)?.(event as MouseEvent);
    if (!event.defaultPrevented) machine.selectKey(key);
  }}
>
  {@render children?.()}
</div>
