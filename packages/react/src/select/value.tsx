import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectValueInfo = {
  /** Labels of the selected value(s), in selection order. */
  labels: string[];
  isPlaceholder: boolean;
};

export type SelectValueProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  /** Shown while nothing is selected. */
  placeholder?: ReactNode;
  /** Custom rendering; defaults to the labels joined by ", ". */
  children?: ReactNode | ((info: SelectValueInfo) => ReactNode);
};

/** The selected label(s), or the placeholder. */
export const Value = forwardRef<HTMLSpanElement, SelectValueProps>(
  function SelectValue({ placeholder, children, ...rest }, ref) {
    const { machine } = useSelectContext("Value");
    useSnapshot(machine, (m) => m.selectedLabels().join("\u0001"));
    const labels = machine.selectedLabels();
    const info: SelectValueInfo = {
      labels,
      isPlaceholder: labels.length === 0,
    };
    let content: ReactNode;
    if (typeof children === "function") {
      content = children(info);
    } else if (info.isPlaceholder) {
      content = placeholder;
    } else {
      content = children ?? labels.join(", ");
    }
    return (
      <span
        data-part="value"
        data-placeholder={info.isPlaceholder ? "" : undefined}
        {...rest}
        ref={ref}
      >
        {content}
      </span>
    );
  },
);
