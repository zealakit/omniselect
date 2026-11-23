<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { checkStructure } from "@zealakit/omniselect-core";
  import { getSelectContext } from "./context.js";

  type Props = HTMLButtonAttributes & {
    /** Accessible name. Default "Clear selection". */
    label?: string;
    children?: Snippet;
  };
  let { label = "Clear selection", children, onclick, ...rest }: Props = $props();
  const context = getSelectContext("Clear");
  const { machine, snapshot } = context;
  const attrs = $derived.by(() => {
    void $snapshot;
    return machine.attrs.clear(label);
  });
  const hasValue = $derived.by(() => {
    void $snapshot;
    return !machine.selection.isEmpty(machine.store.get().value);
  });

  let element: HTMLButtonElement | undefined = $state();
  $effect(() => {
    checkStructure("Clear", element);
    return machine.registerClear();
  });
</script>

<button
  type="button"
  data-part="clear"
  {...rest}
  {...attrs}
  bind:this={element}
  hidden={!hasValue}
  onclick={(event) => {
    (onclick as ((e: MouseEvent) => void) | undefined)?.(event as MouseEvent);
    if (!event.defaultPrevented) {
      machine.clear();
      context.focusField();
    }
  }}
>
  {@render children?.()}
</button>
