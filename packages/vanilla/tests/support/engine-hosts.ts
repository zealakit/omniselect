import {
  createFocusScope,
  createLayer,
  type FocusScopeHandle,
  type LayerHandle,
} from "@zealakit/ui-engine";

/**
 * A dialog and a popover built only from `ui-engine`, to host a Select (X36: tests never use
 * another component). The dialog is a modal layer with a trapped focus scope; the popover is a
 * non-modal layer. Both give focus back to their trigger when they close.
 */
export type Host = { open(): void; close(): void; destroy(): void };

function createHost(modal: boolean, trigger: HTMLElement, content: HTMLElement): Host {
  let layer: LayerHandle | null = null;
  let scope: FocusScopeHandle | null = null;
  const show = (open: boolean): void => {
    content.hidden = !open;
    content.setAttribute("data-state", open ? "open" : "closed");
    trigger.setAttribute("aria-expanded", String(open));
  };
  const close = (): void => {
    if (!layer) return;
    scope?.deactivate();
    scope = null;
    layer.release();
    layer = null;
    show(false);
    trigger.focus();
  };
  const open = (): void => {
    if (layer) return;
    show(true);
    layer = createLayer({ element: content, inside: [trigger], modal, onDismiss: close });
    scope = createFocusScope({
      container: content,
      trap: modal,
      initialFocus: "none",
      returnFocus: false,
      layer,
    });
    scope.activate();
  };
  show(false);
  trigger.addEventListener("click", open);
  return {
    open,
    close,
    destroy() {
      trigger.removeEventListener("click", open);
      close();
    },
  };
}

type HostOptions = { trigger: HTMLElement; content: HTMLElement };

export const createDialog = ({ trigger, content }: HostOptions): Host =>
  createHost(true, trigger, content);
export const createPopover = ({ trigger, content }: HostOptions): Host =>
  createHost(false, trigger, content);
