import { defineComponent, h, nextTick, onBeforeUnmount, onMounted } from "vue";
import { useSelectContext } from "./context.js";
import { attrsOf } from "./simple.js";

/**
 * Text input. Mounting it switches the Select to the editable combobox
 * pattern: the input takes `role="combobox"` and the trigger becomes a plain
 * button. Focus stays here while the list is used.
 */
export const Input = defineComponent({
  name: "SelectInput",
  setup() {
    const context = useSelectContext("Input");
    const { machine } = context;
    let composing = false;
    let off: (() => void) | undefined;
    // Registering before mount keeps hydration markup stable: the server renders select-only.
    onMounted(() => {
      off = machine.registerInput();
    });
    onBeforeUnmount(() => off?.());
    return () => {
      context.version.value;
      return h("input", {
        type: "text",
        "data-part": "input",
        ...attrsOf(machine.attrs.input()),
        disabled: machine.attrs.input()["aria-disabled"] === "true",
        value: machine.store.get().inputValue,
        ref: context.inputEl,
        onInput: (event: Event) => {
          const el = event.target as HTMLInputElement;
          machine.onInput(el.value, { composing });
          // A controlled parent may reject the text; show the machine's value again.
          void nextTick().then(() => {
            if (!composing && el.value !== machine.store.get().inputValue) {
              el.value = machine.store.get().inputValue;
            }
          });
        },
        onCompositionstart: () => {
          composing = true;
        },
        onCompositionend: (event: Event) => {
          composing = false;
          machine.onInput((event.target as HTMLInputElement).value);
        },
        onKeydown: (event: KeyboardEvent) => {
          const result = machine.onInputKeyDown({
            key: event.key,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            isComposing: event.isComposing || composing,
          });
          if (result.preventDefault) {
            event.preventDefault();
          }
        },
        onFocus: () => machine.onInputFocus(),
        onClick: () => machine.onInputClick(),
        onBlur: () => machine.onInputBlur(),
      });
    };
  },
});
