<script lang="ts">
import { setContext, type Snippet } from "svelte";
import type { HTMLOptgroupAttributes } from "svelte/elements";
import { GROUP_KEY } from "./context.js";

type Props = HTMLOptgroupAttributes & { children?: Snippet };
let { disabled = false, children, ...rest }: Props = $props();

setContext(GROUP_KEY, {
  get disabled() {
    return disabled === true;
  },
});
</script>

<optgroup {...rest} {disabled} data-disabled={disabled ? "" : undefined}>
  {@render children?.()}
</optgroup>
