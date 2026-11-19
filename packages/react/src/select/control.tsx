import { forwardRef, type HTMLAttributes } from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { reactAttrs, useSnapshot } from "./internal.js";
import { useSelectContext } from "./context.js";

export type SelectControlProps = HTMLAttributes<HTMLDivElement>;

/** Wrapper that groups trigger, clear, and indicator. The popover anchors to it. */
export const Control = forwardRef<HTMLDivElement, SelectControlProps>(
  function SelectControl(props, ref) {
    const { machine, setControlEl } = useSelectContext("Control");
    const mergedRef = useMergedRef(ref, setControlEl);
    useSnapshot(machine, (m) => `${m.isOpen()}|${m.isInvalid()}`);
    return (
      <div
        data-part="control"
        {...props}
        {...reactAttrs(machine.attrs.root())}
        ref={mergedRef}
      />
    );
  },
);
