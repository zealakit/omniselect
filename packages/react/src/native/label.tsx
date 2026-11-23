import { forwardRef, type LabelHTMLAttributes } from "react";
import { useNativeContext } from "./context.js";

export type NativeSelectLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/** `<label>` linked to the control. */
export const Label = forwardRef<HTMLLabelElement, NativeSelectLabelProps>(
  function NativeSelectLabel(props, ref) {
    const context = useNativeContext("Label");
    return (
      <label
        data-disabled={context.disabled ? "" : undefined}
        data-required={context.required ? "" : undefined}
        {...props}
        htmlFor={props.htmlFor ?? context.controlId}
        ref={ref}
      />
    );
  },
);
