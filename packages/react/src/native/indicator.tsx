import { forwardRef, type HTMLAttributes } from "react";
import { useNativeContext } from "./context.js";

export type NativeSelectIndicatorProps = HTMLAttributes<HTMLSpanElement>;

/** Decorative slot (for example a chevron). Hidden from assistive technology. */
export const Indicator = forwardRef<
  HTMLSpanElement,
  NativeSelectIndicatorProps
>(function NativeSelectIndicator(props, ref) {
  const context = useNativeContext("Indicator");
  return (
    <span
      data-part="indicator"
      data-disabled={context.disabled ? "" : undefined}
      {...props}
      aria-hidden="true"
      ref={ref}
    />
  );
});
