import {
  createFocusScope,
  createLayer,
  type FocusScopeHandle,
  type LayerHandle,
} from "@zealakit/ui-engine";
import {
  defineComponent,
  h,
  inject,
  type InjectionKey,
  onBeforeUnmount,
  provide,
  type Ref,
  ref,
  watch,
} from "vue";

/**
 * A dialog and a popover built only from `ui-engine`, to host a Select (X36: tests never use
 * another component). Content mounts only while open; focus returns to the trigger on close.
 */
type HostState = { open: Ref<boolean>; trigger: Ref<HTMLElement | null> };

function createHost(modal: boolean) {
  const key: InjectionKey<HostState> = Symbol("host");

  const Root = defineComponent({
    setup(_props, { slots }) {
      provide(key, { open: ref(false), trigger: ref(null) });
      return () => slots.default?.();
    },
  });

  const Trigger = defineComponent({
    setup(_props, { slots }) {
      const host = inject(key)!;
      return () =>
        h(
          "button",
          { type: "button", ref: host.trigger, onClick: () => (host.open.value = true) },
          slots.default?.(),
        );
    },
  });

  const Content = defineComponent({
    setup(_props, { slots }) {
      const host = inject(key)!;
      const element = ref<HTMLElement | null>(null);
      let layer: LayerHandle | null = null;
      let scope: FocusScopeHandle | null = null;
      const clear = (): void => {
        scope?.deactivate();
        scope = null;
        layer?.release();
        layer = null;
      };
      watch(
        host.open,
        (open) => {
          clear();
          if (!open || !element.value) return;
          layer = createLayer({
            element: element.value,
            inside: host.trigger.value ? [host.trigger.value] : [],
            modal,
            onDismiss: () => {
              // Leave the trap first, or it pulls the focus back into the closing content.
              scope?.deactivate();
              host.open.value = false;
              host.trigger.value?.focus();
            },
          });
          scope = createFocusScope({
            container: element.value,
            trap: modal,
            initialFocus: "none",
            returnFocus: false,
            layer,
          });
          scope.activate();
        },
        { flush: "post" },
      );
      onBeforeUnmount(clear);
      return () =>
        host.open.value
          ? h("div", { ref: element, "data-state": "open" }, slots.default?.())
          : null;
    },
  });

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
