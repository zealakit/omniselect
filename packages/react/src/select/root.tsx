import {
  createSelectMachine,
  type SelectCloseReason,
  type SelectMachine,
  type SelectOpenReason,
} from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-react";
import { type ReactNode, useCallback, useId, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { SelectContext, type SelectContextValue } from "./context.js";

export type SelectOpenChangeReason = SelectOpenReason | SelectCloseReason;

export type SelectRootProps<T> = {
  /** Selected value. Controlled when defined. */
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: SelectOpenChangeReason) => void;
  /** Map a value to a stable string key. Default `String(value)`. */
  itemToKey?: (value: T) => string;
  /** Label for a selected value whose item is not mounted (closed popover, SSR). */
  itemToString?: (value: T) => string;
  disabled?: boolean;
  required?: boolean;
  /** Close after a pick. Default `true`. */
  closeOnSelect?: boolean;
  /** When `false`, the popover does not open while there is nothing to show. Default `true`. */
  allowsEmptyCollection?: boolean;
  /** Wrap keyboard navigation at the ends. Default `false`. */
  loop?: boolean;
  placement?: Placement;
  offset?: number;
  /** Set `--omniselect-anchor-width` on the popover. Default `true`. */
  matchWidth?: boolean;
  /** `true` portals to `document.body`, an element portals there, `false` renders in place. */
  portal?: boolean | Element | null;
  children?: ReactNode;
};

/** State orchestrator. Renders no element. */
export function Root<T>(props: SelectRootProps<T>) {
  const {
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    itemToKey,
    itemToString,
    disabled = false,
    required = false,
    closeOnSelect,
    allowsEmptyCollection,
    loop,
    placement = "bottom-start",
    offset = 4,
    matchWidth = true,
    portal = true,
    children,
  } = props;
  const rootId = `omniselect-${useId().replaceAll(":", "")}`;
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  const [controlEl, setControlEl] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  triggerRef.current = triggerEl;
  const latest = useRef({ onOpenChange });
  latest.current = { onOpenChange };

  const machineRef = useRef<SelectMachine<T> | null>(null);
  if (machineRef.current === null) {
    machineRef.current = createSelectMachine<T>({
      rootId,
      itemToKey,
      itemToString,
      value: value as never,
      defaultValue: defaultValue as never,
      onValueChange: onValueChange as never,
      open,
      defaultOpen,
      disabled,
      required,
      closeOnSelect,
      allowsEmptyCollection,
      loop,
      onOpenChange(next, reason) {
        latest.current.onOpenChange?.(next, reason);
        if (
          !next &&
          (reason === "select" || reason === "escape" || reason === "tab")
        ) {
          triggerRef.current?.focus();
        }
      },
    });
  }
  const machine = machineRef.current;

  useIsomorphicLayoutEffect(() => {
    machine.sync({
      value: value as never,
      onValueChange: onValueChange as never,
      open,
      disabled,
      required,
      closeOnSelect,
      allowsEmptyCollection,
      loop,
    });
  });

  const focusTrigger = useCallback(() => triggerRef.current?.focus(), []);

  const context: SelectContextValue = {
    machine,
    triggerEl,
    setTriggerEl,
    controlEl,
    setControlEl,
    focusTrigger,
    placement,
    offset,
    matchWidth,
    portal,
  };
  return (
    <SelectContext.Provider value={context}>{children}</SelectContext.Provider>
  );
}
