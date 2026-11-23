import { forwardRef, type OptgroupHTMLAttributes } from "react";
import { OptionGroupContext } from "./context.js";

export type NativeSelectOptionGroupProps = OptgroupHTMLAttributes<HTMLOptGroupElement>;

/** `<optgroup>`. Disabling it disables every option inside. */
export const OptionGroup = forwardRef<HTMLOptGroupElement, NativeSelectOptionGroupProps>(
  function NativeSelectOptionGroup({ disabled, ...rest }, ref) {
    return (
      <OptionGroupContext.Provider value={{ disabled: disabled === true }}>
        <optgroup
          {...rest}
          ref={ref}
          disabled={disabled}
          data-disabled={disabled ? "" : undefined}
        />
      </OptionGroupContext.Provider>
    );
  },
);
