import { forwardRef, type HTMLAttributes } from "react";
import { useSelectContext } from "./context.js";
import { reactAttrs, useSnapshot } from "./internal.js";

export type SelectListProps = HTMLAttributes<HTMLDivElement>;

/** The listbox. Items, groups, Empty, and LoadMore go inside. */
export const List = forwardRef<HTMLDivElement, SelectListProps>(function SelectList(props, ref) {
  const { machine } = useSelectContext("List");
  useSnapshot(machine, (m) => `${m.isOpen()}|${m.store.get().hasLoading}`);
  return <div data-part="list" {...props} {...reactAttrs(machine.attrs.list())} ref={ref} />;
});
