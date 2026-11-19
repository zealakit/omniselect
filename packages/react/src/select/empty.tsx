import { forwardRef, type HTMLAttributes } from "react";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectEmptyProps = HTMLAttributes<HTMLDivElement>;

/** Rendered while the visible collection is empty. */
export const Empty = forwardRef<HTMLDivElement, SelectEmptyProps>(
  function SelectEmpty(props, ref) {
    const { machine } = useSelectContext("Empty");
    const count = useSnapshot(machine, (m) =>
      String(m.collection.visible().length),
    );
    if (count !== "0") {
      return null;
    }
    return <div data-part="empty" {...props} role="presentation" ref={ref} />;
  },
);
