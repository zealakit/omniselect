<script lang="ts">
import { nextId } from "@zealakit/omniselect-core";
import { setContext, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext, GROUP_KEY } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Disables every item inside the group. */
  disabled?: boolean;
  children?: Snippet;
};
let { disabled = false, children, ...rest }: Props = $props();
const { machine } = getSelectContext("Group");
const groupId = nextId("group");
const state = $state({ hasLabel: false });
setContext(GROUP_KEY, {
  groupId,
  setHasLabel: (value: boolean) => {
    state.hasLabel = value;
  },
});

$effect(() => machine.collection.registerGroup(groupId, { disabled }));
const { snapshot } = getSelectContext("Group");
const attrs = $derived(machine.attrs.group(groupId, state.hasLabel));
const visible = $derived.by(() => {
  void $snapshot;
  return machine.collection.groupHasVisible(groupId);
});
</script>

<div data-part="group" data-disabled={disabled ? "" : undefined} {...rest} {...attrs} hidden={!visible}>{@render children?.()}</div>
