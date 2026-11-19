<script lang="ts">
import { NativeSelect } from "../../dist/native/index.js";

type Node = {
  part: string;
  props?: Record<string, unknown>;
  text?: string;
  children?: Node[];
};
let {
  tree,
  initial,
  form,
}: { tree: Node[]; initial: Record<string, unknown>; form: boolean } = $props();
let rootProps = $state.raw(initial);
export function setRootProps(next: Record<string, unknown>) {
  rootProps = { ...rootProps, ...next };
}
</script>

{#snippet render(node: Node)}
  {#if node.part === "label"}
    <NativeSelect.Label {...node.props}>{node.text}</NativeSelect.Label>
  {:else if node.part === "control"}
    <NativeSelect.Control {...node.props}>
      {#each node.children ?? [] as child}{@render render(child)}{/each}
    </NativeSelect.Control>
  {:else if node.part === "option"}
    <NativeSelect.Option {...(node.props as any)}>{node.text}</NativeSelect.Option>
  {:else if node.part === "optionGroup"}
    <NativeSelect.OptionGroup {...node.props}>
      {#each node.children ?? [] as child}{@render render(child)}{/each}
    </NativeSelect.OptionGroup>
  {:else if node.part === "indicator"}
    <NativeSelect.Indicator {...node.props}>{node.text}</NativeSelect.Indicator>
  {/if}
{/snippet}

{#snippet body()}
  <NativeSelect.Root {...rootProps}>
    {#each tree as node}{@render render(node)}{/each}
  </NativeSelect.Root>
{/snippet}

{#if form}
  <form>{@render body()}</form>
{:else}
  {@render body()}
{/if}
