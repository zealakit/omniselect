<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getSelectContext } from "./context.js";

  type Props = HTMLAttributes<HTMLSpanElement> & { children?: Snippet };
  let { children, ...rest }: Props = $props();
  const { machine } = getSelectContext("Label");
</script>

<span data-part="label" {...rest} id={machine.ids.label}>{@render children?.()}</span>
