<script lang="ts" generics="T">
import { getContext, setContext, untrack, type Snippet } from "svelte";
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

// Register once per item (not per element): a filtered-out item keeps its
// registration while its element is gone. `ready` waits for the first mount so
// the item's text can be read.
let ready = $state(false);
let text = "";
$effect(() => {
  if (element) {
    text = element.textContent?.trim() ?? text;
    ready = true;
  }
});
let registered = $state(false);
$effect(() => {
  if (!ready) return;
  registered = true;
  return machine.collection.register({
    key,
    value,
    textValue: textValue ?? untrack(() => text),
    disabled,
    groupId: group?.groupId ?? null,
    node: untrack(() => element),
  });
});

// The element mounts and unmounts as the filter changes; keep the DOM-order node current.
$effect(() => {
  const node = element;
  untrack(() => {
    if (machine.collection.get(key)) machine.collection.update(key, { node });
  });
});

const visible = $derived.by(() => {
  void $snapshot;
  // Until the first registration an item is shown (the filter does not know it yet).
  return !registered || machine.collection.isVisible(key);
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
{#if visible}
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
{/if}
