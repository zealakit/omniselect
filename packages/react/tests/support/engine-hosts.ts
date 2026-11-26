import {
  createFocusScope,
  createLayer,
  type FocusScopeHandle,
  type LayerHandle,
} from "@zealakit/ui-engine";
import {
  createContext,
  createElement as h,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * A dialog and a popover built only from `ui-engine`, to host a Select (X36: tests never use
 * another component). Content mounts only while open; focus returns to the trigger on close.
 */
type HostState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger: { current: HTMLButtonElement | null };
};

type Props = Record<string, unknown> & { children?: ReactNode };

function createHost(modal: boolean) {
  const Context = createContext<HostState | null>(null);

  const Root = ({ children }: Props) => {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement | null>(null);
    return h(Context.Provider, { value: { open, setOpen, trigger } }, children);
  };

  const Trigger = ({ children, ...props }: Props) => {
    const host = useContext(Context)!;
    return h(
      "button",
      { ...props, type: "button", ref: host.trigger, onClick: () => host.setOpen(true) },
      children,
    );
  };

  const Content = ({ children, ...props }: Props) => {
    const host = useContext(Context)!;
    const element = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const content = element.current;
      if (!host.open || !content) return;
      let scope: FocusScopeHandle | null = null;
      const layer: LayerHandle = createLayer({
        element: content,
        inside: host.trigger.current ? [host.trigger.current] : [],
        modal,
        onDismiss: () => {
          // Leave the trap first, or it pulls the focus back into the closing content.
          scope?.deactivate();
          host.setOpen(false);
          host.trigger.current?.focus();
        },
      });
      scope = createFocusScope({
        container: content,
        trap: modal,
        initialFocus: "none",
        returnFocus: false,
        layer,
      });
      scope.activate();
      return () => {
        scope?.deactivate();
        layer.release();
      };
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- `host` is a new object every render; the layer follows `open` only
    }, [host.open]);
    return host.open ? h("div", { ...props, ref: element, "data-state": "open" }, children) : null;
  };

  return { Root, Trigger, Content };
}

const dialog = createHost(true);
const popover = createHost(false);

export const Dialog = dialog.Root;
export const DialogTrigger = dialog.Trigger;
export const DialogContent = dialog.Content;
export const Popover = popover.Root;
export const PopoverTrigger = popover.Trigger;
export const PopoverContent = popover.Content;
