<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = HTMLAttributes<HTMLSpanElement> & { children?: Snippet };
  let { children, ...rest }: Props = $props();
  const { machine, snapshot } = getSelectContext("Indicator");
  const open = $derived.by(() => {
    void $snapshot;
    return machine.isOpen();
  });
</script>

<span data-part="indicator" {...rest} aria-hidden="true" data-state={open ? "open" : "closed"}
  >{@render children?.()}</span
>
