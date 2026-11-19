import { forwardRef, type HTMLAttributes } from "react";
import { useSelectContext } from "./context.js";

export type SelectLabelProps = HTMLAttributes<HTMLSpanElement>;

/** Accessible name. The trigger references it with `aria-labelledby`. */
export const Label = forwardRef<HTMLSpanElement, SelectLabelProps>(
  function SelectLabel(props, ref) {
    const { machine } = useSelectContext("Label");
    return (
      <span data-part="label" {...props} id={machine.ids.label} ref={ref} />
    );
  },
);
