<script lang="ts">
import { getContext, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext, GROUP_KEY } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
let { children, ...rest }: Props = $props();
const { machine } = getSelectContext("GroupLabel");
const group = getContext<
  { groupId: string; setHasLabel: (value: boolean) => void } | undefined
>(GROUP_KEY);
if (!group) {
  throw new Error("Select.GroupLabel must be rendered inside Select.Group.");
}
$effect(() => {
  group.setHasLabel(true);
  return () => group.setHasLabel(false);
});
const attrs = machine.attrs.groupLabel(group.groupId);
</script>

<div data-part="group-label" {...rest} {...attrs}>{@render children?.()}</div>
