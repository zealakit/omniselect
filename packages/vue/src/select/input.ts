import { createCompositionGuard, isImeComposing } from "@zealakit/ui-engine/keyboard";
import type { CompositionGuard } from "@zealakit/ui-engine/keyboard";
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
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
    // E30/E31: the engine guard owns composition state for this input.
    let composition: CompositionGuard | null = null;
    let off: (() => void) | undefined;
    // Registering before mount keeps hydration markup stable: the server renders select-only.
    onMounted(() => {
      if (context.inputEl.value) {
        composition = createCompositionGuard(context.inputEl.value);
      }
      off = machine.registerInput({
        inPopover: context.inputEl.value?.closest('[data-part="popover"]') != null,
      });
      if (machine.store.get().inputInPopover && machine.isOpen()) {
        context.inputEl.value?.focus({ preventScroll: true });
      }
    });
    // Search-in-popover: focus the input as soon as the popover opens.
    watch(
      () => {
        context.version.value;
        return machine.isOpen();
      },
      (open) => {
        if (open && machine.store.get().inputInPopover) {
          void nextTick().then(() => context.inputEl.value?.focus({ preventScroll: true }));
        }
      },
    );
    onBeforeUnmount(() => {
      off?.();
      composition?.destroy();
      composition = null;
    });
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
          const composing = composition?.composing ?? false;
          machine.onInput(el.value, { composing });
          // A controlled parent may reject the text; show the machine's value again.
          void nextTick().then(() => {
            if (!(composition?.composing ?? false) && el.value !== machine.store.get().inputValue) {
              el.value = machine.store.get().inputValue;
            }
          });
        },
        onCompositionend: (event: Event) => {
          // The guard tracks the lifecycle; this only commits the IME text.
          machine.onInput((event.target as HTMLInputElement).value);
        },
        onKeydown: (event: KeyboardEvent) => {
          const result = machine.onInputKeyDown({
            key: event.key,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            isComposing:
              isImeComposing(event) ||
              (composition?.composing ?? false) ||
              (composition?.justEnded(event) ?? false),
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
