<script lang="ts">
import { Select } from "../../dist/select/index.js";

type Node = {
  part: string;
  props?: Record<string, unknown>;
  text?: string;
  children?: Node[];
};
let {
  tree,
  initial,
  form = false,
}: {
  tree: Node[];
  initial: Record<string, unknown>;
  form?: boolean;
} = $props();
let rootProps = $state.raw(initial);
export function setRootProps(next: Record<string, unknown>) {
  rootProps = { ...rootProps, ...next };
}
</script>

{#snippet kids(node: Node)}
  {#if node.children}
    {#each node.children as child}{@render render(child)}{/each}
  {:else if node.text !== undefined}
    {node.text}
  {/if}
{/snippet}

{#snippet render(node: Node)}
  {#if node.part === "itemText"}{node.text}
  {:else if node.part === "outside"}<button data-part="outside" type="button">{node.text}</button>
  {:else if node.part === "label"}<Select.Label {...node.props}>{@render kids(node)}</Select.Label>
  {:else if node.part === "control"}<Select.Control {...node.props}>{@render kids(node)}</Select.Control>
  {:else if node.part === "input"}<Select.Input {...node.props} />
  {:else if node.part === "trigger"}<Select.Trigger {...node.props}>{@render kids(node)}</Select.Trigger>
  {:else if node.part === "value"}<Select.Value {...node.props} />
  {:else if node.part === "clear"}<Select.Clear {...node.props}>{@render kids(node)}</Select.Clear>
  {:else if node.part === "indicator"}<Select.Indicator {...node.props}>{@render kids(node)}</Select.Indicator>
  {:else if node.part === "popover"}<Select.Popover {...node.props}>{@render kids(node)}</Select.Popover>
  {:else if node.part === "list"}<Select.List {...node.props}>{@render kids(node)}</Select.List>
  {:else if node.part === "group"}<Select.Group {...node.props}>{@render kids(node)}</Select.Group>
  {:else if node.part === "groupLabel"}<Select.GroupLabel {...node.props}>{@render kids(node)}</Select.GroupLabel>
  {:else if node.part === "item"}<Select.Item {...(node.props as any)}>{@render kids(node)}</Select.Item>
  {:else if node.part === "itemIndicator"}<Select.ItemIndicator {...node.props}>{@render kids(node)}</Select.ItemIndicator>
  {:else if node.part === "empty"}<Select.Empty {...node.props}>{@render kids(node)}</Select.Empty>
  {/if}
{/snippet}

{#snippet body()}
  <Select.Root {...rootProps}>
    {#each tree as node}{@render render(node)}{/each}
  </Select.Root>
{/snippet}

<div>
  {#if form}
    <form>{@render body()}</form>
  {:else}
    {@render body()}
  {/if}
</div>
