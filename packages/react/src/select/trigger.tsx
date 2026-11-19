import { type ButtonHTMLAttributes, forwardRef } from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { useSelectContext } from "./context.js";
import { reactAttrs, useSnapshot } from "./internal.js";

export type SelectTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** The focusable button. Toggles the popover and owns keyboard handling. */
export const Trigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ onClick, onKeyDown, onKeyUp, ...rest }, ref) {
    const { machine, setTriggerEl, focusField } = useSelectContext("Trigger");
    const mergedRef = useMergedRef(ref, setTriggerEl);
    useSnapshot(machine, (m) => {
      const s = m.store.get();
      return `${s.open}|${s.highlightedKey}|${s.mode}|${s.invalid}|${m.selection.keys(s.value).join(",")}`;
    });
    const attrs = machine.attrs.trigger();
    return (
      <button
        type="button"
        data-part="trigger"
        {...rest}
        {...reactAttrs(attrs)}
        disabled={attrs["aria-disabled"] === "true"}
        ref={mergedRef}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            machine.toggle();
            if (machine.store.get().mode === "combobox") {
              focusField();
            }
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) {
            return;
          }
          const result = machine.onTriggerKeyDown({
            key: event.key,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            isComposing: event.nativeEvent.isComposing,
          });
          if (result.preventDefault) {
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          // Space activates a button on keyup; the machine already handled keydown.
          if (event.key === " ") {
            event.preventDefault();
          }
        }}
      />
    );
  },
);
