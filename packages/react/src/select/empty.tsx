import { forwardRef, type HTMLAttributes } from "react";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectEmptyProps = HTMLAttributes<HTMLDivElement>;

/** Rendered while the visible collection is empty. */
export const Empty = forwardRef<HTMLDivElement, SelectEmptyProps>(function SelectEmpty(props, ref) {
  const { machine } = useSelectContext("Empty");
  const count = useSnapshot(
    machine,
    (m) => `${m.collection.visible().length}|${m.store.get().hasLoading}`,
  );
  // While a page is loading the list is not empty yet.
  if (count !== "0|false") {
    return null;
  }
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: options are reached through aria-activedescendant, never focused
    <div
      data-part="empty"
      {...props}
      role="option"
      aria-disabled="true"
      aria-selected="false"
      ref={ref}
    />
  );
});
