<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";
import { getNativeContext } from "./context.js";

type Props = HTMLLabelAttributes & { children?: Snippet };
let { children, ...rest }: Props = $props();
const context = getNativeContext("Label");
</script>

<!-- svelte-ignore a11y_label_has_associated_control -->
<label
  for={context.controlId}
  data-disabled={context.props.disabled ? "" : undefined}
  data-required={context.props.required ? "" : undefined}
  {...rest}
>
  {@render children?.()}
</label>
