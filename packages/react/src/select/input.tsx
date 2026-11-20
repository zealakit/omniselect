import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { useMergedRef } from "../internal/merge-refs.js";
import { useSelectContext } from "./context.js";
import { reactAttrs, useSnapshot } from "./internal.js";

export type SelectInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "children"
> & { children?: ReactNode };

/**
 * Text input. Mounting it switches the Select to the editable combobox
 * pattern: the input takes `role="combobox"` and the trigger becomes a plain
 * button. Focus stays here while the list is used.
 */
export const Input = forwardRef<HTMLInputElement, SelectInputProps>(
  function SelectInput(
    {
      onChange,
      onKeyDown,
      onFocus,
      onClick,
      onBlur,
      onCompositionStart,
      onCompositionEnd,
      ...rest
    },
    ref,
  ) {
    const { machine, inputRef } = useSelectContext("Input");
    const mergedRef = useMergedRef(ref, inputRef);
    const composing = useRef(false);
    const open = useSnapshot(machine, (m) => String(m.isOpen())) === "true";
    useIsomorphicLayoutEffect(
      () =>
        machine.registerInput({
          inPopover: inputRef.current?.closest('[data-part="popover"]') != null,
        }),
      [machine, inputRef],
    );
    // Search-in-popover: focus the input as soon as the popover opens.
    useEffect(() => {
      if (open && machine.store.get().inputInPopover) {
        inputRef.current?.focus();
      }
    }, [open, machine, inputRef]);
    useSnapshot(machine, (m) => {
      const s = m.store.get();
      return `${s.open}|${s.highlightedKey}|${s.inputValue}|${m.isInvalid()}`;
    });
    const attrs = machine.attrs.input();
    return (
      <input
        type="text"
        data-part="input"
        {...rest}
        {...reactAttrs(attrs)}
        disabled={attrs["aria-disabled"] === "true"}
        ref={mergedRef}
        value={machine.store.get().inputValue}
        onChange={(event) => {
          onChange?.(event);
          if (!event.defaultPrevented) {
            machine.onInput(event.target.value, {
              composing: composing.current,
            });
          }
        }}
        onCompositionStart={(event) => {
          onCompositionStart?.(event);
          composing.current = true;
        }}
        onCompositionEnd={(event) => {
          onCompositionEnd?.(event);
          composing.current = false;
          machine.onInput(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) {
            return;
          }
          const result = machine.onInputKeyDown({
            key: event.key,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            isComposing: event.nativeEvent.isComposing || composing.current,
          });
          if (result.preventDefault) {
            event.preventDefault();
          }
        }}
        onFocus={(event) => {
          onFocus?.(event);
          machine.onInputFocus();
        }}
        onClick={(event) => {
          onClick?.(event);
          machine.onInputClick();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          machine.onInputBlur();
        }}
      />
    );
  },
);
