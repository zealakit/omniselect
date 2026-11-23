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

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  data-part="control"
  {...rest}
  {...attrs}
  bind:this={element}
  onclick={(event) => {
    // Combobox: a press anywhere on the control (not on a button or the input) edits the text.
    if (
      machine.store.get().mode === "combobox" &&
      !machine.store.get().inputInPopover &&
      (event.target as Element).closest("input, button, a") === null
    ) {
      context.focusField();
      machine.onInputClick();
    }
  }}
>
  {@render children?.()}
</div>
