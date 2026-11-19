<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getNativeContext } from "./context.js";

type Props = HTMLAttributes<HTMLSpanElement> & { children?: Snippet };
let { children, ...rest }: Props = $props();
const context = getNativeContext("Indicator");
</script>

<span
  data-part="indicator"
  data-disabled={context.props.disabled ? "" : undefined}
  {...rest}
  aria-hidden="true"
>
  {@render children?.()}
</span>
