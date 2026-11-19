import { checkStructure } from "@zealakit/omniselect-core";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { useSelectContext } from "./context.js";
import { reactAttrs, useSnapshot } from "./internal.js";

export type SelectClearProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name. Default "Clear selection". */
  label?: string;
};

/** Button that resets the selection. Place it beside the trigger, never inside it. */
export const Clear = forwardRef<HTMLButtonElement, SelectClearProps>(
  function SelectClear({ label = "Clear selection", onClick, ...rest }, ref) {
    const { machine, focusField } = useSelectContext("Clear");
    const elementRef = useRef<HTMLButtonElement | null>(null);
    const mergedRef = useMergedRef(ref, elementRef);
    useEffect(() => {
      checkStructure("Clear", elementRef.current);
      return machine.registerClear();
    }, [machine]);
    const hasValue =
      useSnapshot(machine, (m) =>
        String(!m.selection.isEmpty(m.store.get().value)),
      ) === "true";
    return (
      <button
        type="button"
        data-part="clear"
        {...rest}
        {...reactAttrs(machine.attrs.clear(label))}
        hidden={!hasValue}
        ref={mergedRef}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            machine.clear();
            focusField();
          }
        }}
      />
    );
  },
);
