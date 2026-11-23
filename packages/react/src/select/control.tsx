import { forwardRef, type HTMLAttributes } from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { reactAttrs, useSnapshot } from "./internal.js";
import { useSelectContext } from "./context.js";

export type SelectControlProps = HTMLAttributes<HTMLDivElement>;

/** Wrapper that groups trigger, clear, and indicator. The popover anchors to it. */
export const Control = forwardRef<HTMLDivElement, SelectControlProps>(function SelectControl(
  { onClick, ...props },
  ref,
) {
  const { machine, setControlEl, focusField } = useSelectContext("Control");
  const mergedRef = useMergedRef(ref, setControlEl);
  useSnapshot(machine, (m) => `${m.isOpen()}|${m.isInvalid()}`);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut to the input; keyboard users reach the input directly
    // biome-ignore lint/a11y/useKeyWithClickEvents: the input and trigger are the keyboard targets
    <div
      data-part="control"
      {...props}
      {...reactAttrs(machine.attrs.root())}
      ref={mergedRef}
      onClick={(event) => {
        onClick?.(event);
        // Combobox: a press anywhere on the control (not on a button or the input) edits the text.
        const target = event.target as Element;
        if (
          !event.defaultPrevented &&
          machine.store.get().mode === "combobox" &&
          !machine.store.get().inputInPopover &&
          target.closest("input, button, a") === null
        ) {
          focusField();
          machine.onInputClick();
        }
      }}
    />
  );
});
