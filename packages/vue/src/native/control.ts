import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useNativeContext } from "./context.js";

/** The semantic `<select>`. The only focusable element. */
export const Control = defineComponent({
  name: "NativeSelectControl",
  setup(_props, { slots }) {
    const context = useNativeContext("Control");
    const { controller } = context;
    const select = ref<HTMLSelectElement | null>(null);
    let cleanup: (() => void) | undefined;

    onMounted(() => {
      const element = select.value;
      const owner = element?.form;
      if (!element || !owner) {
        return;
      }
      const onReset = () => {
        queueMicrotask(() => {
          controller.reset();
          controller.toDom(element);
        });
      };
      owner.addEventListener("reset", onReset);
      cleanup = () => owner.removeEventListener("reset", onReset);
    });
    onBeforeUnmount(() => cleanup?.());

    return () => {
      context.version.value; // re-render on state changes
      const state = controller.store.get();
      const props = context.props;
      const placeholder = !props.multiple && controller.selection.isEmpty(state.value);
      return h(
        "select",
        {
          id: context.controlId,
          ref: select,
          name: props.name,
          form: props.form,
          multiple: props.multiple,
          required: props.required,
          disabled: props.disabled,
          autocomplete: props.autocomplete,
          "data-disabled": props.disabled ? "" : undefined,
          "data-required": props.required ? "" : undefined,
          "data-invalid": state.invalid || state.invalidProp ? "" : undefined,
          "aria-invalid": state.invalid || state.invalidProp ? "true" : undefined,
          "data-placeholder": placeholder ? "" : undefined,
          onChange: (event: Event) => {
            const element = event.currentTarget as HTMLSelectElement;
            controller.fromDom(element);
            if (controller.isControlled()) {
              // Parent may reject the change; show the controlled value again.
              void nextTick().then(() => controller.toDom(element));
            }
          },
          onInvalid: () => controller.setInvalid(true),
        },
        slots.default?.(),
      );
    };
  },
});
