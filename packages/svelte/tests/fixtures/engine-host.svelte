<script lang="ts">
  // A dialog (`modal`) or popover built only from `ui-engine`, to host a Select (X36).
  import { setContext, type Snippet } from "svelte";

  let { modal = false, children }: { modal?: boolean; children?: Snippet } = $props();
  let open = $state(false);
  let trigger: HTMLElement | null = null;

  setContext("engine-host", {
    get modal() {
      return modal;
    },
    get open() {
      return open;
    },
    setOpen(next: boolean) {
      open = next;
    },
    get trigger() {
      return trigger;
    },
    setTrigger(element: HTMLElement) {
      trigger = element;
    },
  });
</script>

{@render children?.()}
