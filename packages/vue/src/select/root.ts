import {
  createSelectMachine,
  visuallyHiddenStyle,
  type SelectMachineOptions,
  withoutUndefined,
} from "@zealakit/omniselect-core";
import { announce } from "@zealakit/ui-engine";
import type { Placement } from "@zealakit/ui-engine/position";
import {
  defineComponent,
  h,
  onMounted,
  onBeforeUnmount,
  type PropType,
  provide,
  shallowRef,
  type VNodeArrayChildren,
  watch,
  useId,
} from "vue";
import { type SelectContext, selectKey } from "./context.js";

/**
 * State orchestrator. Renders no element.
 * `v-model` maps to `modelValue`, `v-model:open` to `open`.
 */
export const Root = defineComponent({
  name: "SelectRoot",
  props: {
    modelValue: { type: null as unknown as PropType<unknown>, default: undefined },
    defaultValue: {
      type: null as unknown as PropType<unknown>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    itemToKey: {
      // oxlint-disable-next-line typescript/no-explicit-any -- the consumer's value type; `unknown` rejects `(user: User) => …`
      type: Function as PropType<(value: any) => string>,
      default: undefined,
    },
    itemToString: {
      // oxlint-disable-next-line typescript/no-explicit-any -- the consumer's value type; `unknown` rejects `(user: User) => …`
      type: Function as PropType<(value: any) => string>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    closeOnSelect: { type: Boolean, default: undefined },
    allowsEmptyCollection: { type: Boolean, default: undefined },
    loop: { type: Boolean, default: undefined },
    inputValue: { type: String, default: undefined },
    defaultInputValue: { type: String, default: undefined },
    filter: {
      // oxlint-disable-next-line typescript/no-explicit-any -- the consumer's value type; `unknown` rejects `(user: User) => …`
      type: [Function, Boolean] as PropType<((item: any, query: string) => boolean) | false>,
      default: undefined,
    },
    openOnFocus: { type: Boolean, default: undefined },
    openOnInput: { type: Boolean, default: undefined },
    selectionBehavior: {
      type: String as PropType<"replace-input" | "keep-input" | "clear-input">,
      default: undefined,
    },
    restoreOnBlur: { type: Boolean, default: undefined },
    autoHighlight: { type: Boolean, default: undefined },
    autoSelectOnTab: { type: Boolean, default: undefined },
    triggerLabel: { type: String, default: undefined },
    invalid: { type: Boolean, default: undefined },
    multiple: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    form: { type: String, default: undefined },
    maxSelected: { type: Number, default: undefined },
    announce: { type: Boolean, default: undefined },
    messages: { type: Object as PropType<unknown>, default: undefined },
    placement: { type: String as PropType<Placement>, default: "bottom-start" },
    offset: { type: Number, default: 4 },
    matchWidth: { type: Boolean, default: true },
    portal: {
      type: [Boolean, String, Object] as PropType<boolean | string | Element | null>,
      default: true,
    },
  },
  emits: {
    "update:modelValue": (_value: unknown) => true,
    valueChange: (_value: unknown) => true,
    "update:open": (_open: boolean) => true,
    openChange: (_open: boolean, _reason: string) => true,
    "update:inputValue": (_value: string) => true,
    inputChange: (_value: string, _reason: string) => true,
  },
  setup(props, { slots, emit }) {
    const triggerEl = shallowRef<HTMLElement | null>(null);
    const controlEl = shallowRef<HTMLElement | null>(null);
    const inputEl = shallowRef<HTMLInputElement | null>(null);
    const onValueChange = (value: unknown) => {
      emit("update:modelValue", value);
      emit("valueChange", value);
    };
    const machine = createSelectMachine<unknown>(
      withoutUndefined<SelectMachineOptions<unknown>>({
        rootId: `omniselect-${useId()}`,
        multiple: props.multiple,
        maxSelected: props.maxSelected,
        announce: props.announce,
        messages: props.messages,
        itemToKey: props.itemToKey,
        itemToString: props.itemToString,
        value: props.modelValue,
        defaultValue: props.defaultValue,
        onValueChange,
        open: props.open,
        defaultOpen: props.defaultOpen,
        disabled: props.disabled,
        required: props.required,
        closeOnSelect: props.closeOnSelect,
        allowsEmptyCollection: props.allowsEmptyCollection,
        loop: props.loop,
        inputValue: props.inputValue,
        defaultInputValue: props.defaultInputValue,
        onInputChange(value, reason) {
          emit("update:inputValue", value);
          emit("inputChange", value, reason);
        },
        filter: props.filter,
        openOnFocus: props.openOnFocus,
        openOnInput: props.openOnInput,
        selectionBehavior: props.selectionBehavior,
        restoreOnBlur: props.restoreOnBlur,
        autoHighlight: props.autoHighlight,
        autoSelectOnTab: props.autoSelectOnTab,
        triggerLabel: props.triggerLabel,
        onOpenChange(open, reason) {
          emit("update:open", open);
          emit("openChange", open, reason);
          if (!open && (reason === "select" || reason === "escape" || reason === "tab")) {
            focusAfterClose();
          }
        },
      }),
    );
    machine.sync({ invalid: props.invalid });
    /** Combobox: the input. A search box inside the popover unmounts on close, so the trigger. */
    function focusAfterClose(): void {
      const target = machine.focusTarget();
      (target === "input" ? (inputEl.value ?? triggerEl.value) : triggerEl.value)?.focus({
        preventScroll: true,
      });
    }
    const version = shallowRef(0);
    const stop = machine.store.subscribe(() => {
      version.value += 1;
    });
    onBeforeUnmount(() => {
      stop();
      machine.destroy();
    });
    watch(
      () => [
        props.modelValue,
        props.open,
        props.disabled,
        props.required,
        props.closeOnSelect,
        props.allowsEmptyCollection,
        props.loop,
        props.inputValue,
        props.filter,
        props.openOnFocus,
        props.openOnInput,
        props.selectionBehavior,
        props.restoreOnBlur,
        props.autoHighlight,
        props.autoSelectOnTab,
        props.triggerLabel,
        props.invalid,
        props.maxSelected,
        props.announce,
        props.messages,
      ],
      () =>
        machine.sync({
          value: props.modelValue,
          onValueChange,
          open: props.open,
          disabled: props.disabled,
          required: props.required,
          closeOnSelect: props.closeOnSelect,
          allowsEmptyCollection: props.allowsEmptyCollection,
          loop: props.loop,
          inputValue: props.inputValue,
          filter: props.filter,
          openOnFocus: props.openOnFocus,
          openOnInput: props.openOnInput,
          selectionBehavior: props.selectionBehavior,
          restoreOnBlur: props.restoreOnBlur,
          autoHighlight: props.autoHighlight,
          autoSelectOnTab: props.autoSelectOnTab,
          triggerLabel: props.triggerLabel,
          invalid: props.invalid,
          maxSelected: props.maxSelected,
          announce: props.announce,
          messages: props.messages,
        }),
      { flush: "sync" },
    );

    const context: SelectContext = {
      machine,
      version,
      triggerEl,
      controlEl,
      inputEl,
      focusTrigger: () => triggerEl.value?.focus({ preventScroll: true }),
      focusField: focusAfterClose,
      props: new Proxy({} as SelectContext["props"], {
        get: (_target, key: string) => (props as Record<string, unknown>)[key],
      }),
    };
    provide(selectKey, context);
    const hidden = shallowRef<HTMLSelectElement | null>(null);
    let offReset: (() => void) | undefined;
    let lastAnnouncement = "";
    onMounted(() => {
      const owner = hidden.value?.form;
      if (!owner) {
        return;
      }
      // The browser resets controls after the event; restore the default value afterwards.
      const onReset = () => queueMicrotask(() => machine.reset());
      owner.addEventListener("reset", onReset);
      offReset = () => owner.removeEventListener("reset", onReset);
    });
    onBeforeUnmount(() => offReset?.());

    return () => {
      version.value;
      const keys = machine.selectedKeys();
      const out: VNodeArrayChildren = [slots.default?.()];
      if (props.name !== undefined || props.required) {
        out.push(
          h(
            "select",
            {
              ref: hidden,
              "data-part": "hidden-select",
              name: props.name,
              form: props.form,
              multiple: props.multiple,
              required: props.required,
              disabled: props.disabled,
              tabindex: "-1",
              "aria-hidden": "true",
              style: visuallyHiddenStyle,
              onChange: (event: Event) =>
                machine.setFromKeys(
                  Array.from((event.target as HTMLSelectElement).selectedOptions).map(
                    (o) => o.value,
                  ),
                ),
              onInvalid: () => {
                machine.setInvalid(true);
                focusAfterClose();
              },
            },
            keys.map((key) => h("option", { key, value: key, selected: true }, key)),
          ),
        );
      }
      // Announcements go through the engine's one page live region (D10). The
      // `live-region` part stays as an empty deprecated marker until the next
      // major; it has no role and no aria-live.
      if (props.announce !== false) {
        out.push(h("span", { "data-part": "live-region", "data-deprecated": true }));
      }
      if (props.announce !== false) {
        const message = machine.store.get().announcement;
        if (message !== "" && message !== lastAnnouncement) {
          lastAnnouncement = message;
          announce(message, { politeness: "polite" });
        }
      }
      return out;
    };
  },
});
