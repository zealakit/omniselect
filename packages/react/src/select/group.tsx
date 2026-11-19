import {
  forwardRef,
  type HTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { GroupContext, useSelectContext } from "./context.js";
import { reactAttrs } from "./internal.js";
import { useContext } from "react";

export type SelectGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** Disables every item inside the group. */
  disabled?: boolean;
};

/** Semantic option group. Labelled by `Select.GroupLabel`. */
export const Group = forwardRef<HTMLDivElement, SelectGroupProps>(
  function SelectGroup({ disabled = false, ...rest }, ref) {
    const { machine } = useSelectContext("Group");
    const groupId = useId().replaceAll(":", "");
    const [hasLabel, setHasLabel] = useState(false);
    useEffect(
      () => machine.collection.registerGroup(groupId, { disabled }),
      [machine, groupId, disabled],
    );
    const value = useMemo(() => ({ groupId, setHasLabel }), [groupId]);
    return (
      <GroupContext.Provider value={value}>
        <div
          data-part="group"
          data-disabled={disabled ? "" : undefined}
          {...rest}
          {...reactAttrs(machine.attrs.group(groupId, hasLabel))}
          ref={ref}
        />
      </GroupContext.Provider>
    );
  },
);

export type SelectGroupLabelProps = HTMLAttributes<HTMLDivElement>;

/** Visible name of a group. */
export const GroupLabel = forwardRef<HTMLDivElement, SelectGroupLabelProps>(
  function SelectGroupLabel(props, ref) {
    const { machine } = useSelectContext("GroupLabel");
    const group = useContext(GroupContext);
    useEffect(() => {
      group?.setHasLabel(true);
      return () => group?.setHasLabel(false);
    }, [group]);
    if (!group) {
      throw new Error(
        "Select.GroupLabel must be rendered inside Select.Group.",
      );
    }
    return (
      <div
        data-part="group-label"
        {...props}
        {...reactAttrs(machine.attrs.groupLabel(group.groupId))}
        ref={ref}
      />
    );
  },
);
