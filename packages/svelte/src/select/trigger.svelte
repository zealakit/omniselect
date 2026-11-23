<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = HTMLButtonAttributes & { children?: Snippet };
  let { children, onclick, onkeydown, onkeyup, ...rest }: Props = $props();
  const context = getSelectContext("Trigger");
  const { machine, snapshot } = context;
  let element: HTMLButtonElement | undefined = $state();
  const attrs = $derived.by(() => {
    void $snapshot;
    return machine.attrs.trigger();
  });

  $effect(() => {
    context.setTriggerEl(element ?? null);
    return () => context.setTriggerEl(null);
  });
</script>

<button
  type="button"
  data-part="trigger"
  {...rest}
  {...attrs}
  disabled={attrs["aria-disabled"] === "true"}
  bind:this={element}
  onclick={(event) => {
    (onclick as ((e: MouseEvent) => void) | undefined)?.(event as MouseEvent);
    if (!event.defaultPrevented) {
      machine.toggle();
      if (machine.store.get().mode === "combobox") context.focusField();
    }
  }}
  onkeydown={(event) => {
    (onkeydown as ((e: KeyboardEvent) => void) | undefined)?.(event as KeyboardEvent);
    if (event.defaultPrevented) return;
    const result = machine.onTriggerKeyDown({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing,
    });
    if (result.preventDefault) event.preventDefault();
  }}
  onkeyup={(event) => {
    (onkeyup as ((e: KeyboardEvent) => void) | undefined)?.(event as KeyboardEvent);
    // Space activates a button on keyup; the machine already handled keydown.
    if (event.key === " ") event.preventDefault();
  }}
>
  {@render children?.()}
</button>
