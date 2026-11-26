<script lang="ts">
  import { getContext, type Snippet } from "svelte";

  let { children, ...rest }: { children?: Snippet; [key: string]: unknown } = $props();
  const host = getContext<{ setOpen(open: boolean): void; setTrigger(element: HTMLElement): void }>(
    "engine-host",
  );

  const register = (node: HTMLElement) => {
    host.setTrigger(node);
  };
</script>

<button {...rest} type="button" use:register onclick={() => host.setOpen(true)}>
  {@render children?.()}
</button>
