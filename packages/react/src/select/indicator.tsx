import { forwardRef, type HTMLAttributes } from "react";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectIndicatorProps = HTMLAttributes<HTMLSpanElement>;

/** Decorative icon slot. `data-state` is `open` or `closed`. */
export const Indicator = forwardRef<HTMLSpanElement, SelectIndicatorProps>(
  function SelectIndicator(props, ref) {
    const { machine } = useSelectContext("Indicator");
    const open = useSnapshot(machine, (m) => String(m.isOpen())) === "true";
    return (
      <span
        data-part="indicator"
        {...props}
        aria-hidden="true"
        data-state={open ? "open" : "closed"}
        ref={ref}
      />
    );
  },
);
