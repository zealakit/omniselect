<script lang="ts">
  import { createFocusScope, createLayer, type FocusScopeHandle } from "@zealakit/ui-engine";
  import { getContext, type Snippet } from "svelte";

  let { children, ...rest }: { children?: Snippet; [key: string]: unknown } = $props();
  const host = getContext<{
    modal: boolean;
    open: boolean;
    trigger: HTMLElement | null;
    setOpen(open: boolean): void;
  }>("engine-host");

  const layered = (node: HTMLElement) => {
    let scope: FocusScopeHandle | null = null;
    const trigger = host.trigger;
    const layer = createLayer({
      element: node,
      inside: trigger ? [trigger] : [],
      modal: host.modal,
      onDismiss: () => {
        // Leave the trap first, or it pulls the focus back into the closing content.
        scope?.deactivate();
        host.setOpen(false);
        trigger?.focus();
      },
    });
    scope = createFocusScope({
      container: node,
      trap: host.modal,
      initialFocus: "none",
      returnFocus: false,
      layer,
    });
    scope.activate();
    return {
      destroy() {
        scope?.deactivate();
        layer.release();
      },
    };
  };
</script>

{#if host.open}
  <div {...rest} data-state="open" use:layered>
    {@render children?.()}
  </div>
{/if}
