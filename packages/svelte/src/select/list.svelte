<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
  let { children, ...rest }: Props = $props();
  const { machine, snapshot } = getSelectContext("List");
  const attrs = $derived.by(() => {
    void $snapshot;
    return machine.attrs.list();
  });
</script>

<div data-part="list" {...rest} {...attrs}>{@render children?.()}</div>
