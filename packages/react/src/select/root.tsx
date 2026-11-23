import {
  createSelectMachine,
  type FilterFn,
  type SelectCloseReason,
  type SelectInputChangeReason,
  type SelectionBehavior,
  type SelectMachine,
  type SelectMessages,
  type SelectOpenReason,
  visuallyHiddenStyle,
} from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-react";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { SelectContext, type SelectContextValue } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectOpenChangeReason = SelectOpenReason | SelectCloseReason;

type SelectRootCommon<T> = {
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
  /** Search text. Controlled when defined. Only used with `Select.Input`. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (value: string, reason: SelectInputChangeReason) => void;
  /** Custom filter, or `false` to filter outside (async search). Default: diacritic-insensitive contains. */
  filter?: FilterFn<T> | false;
  openOnFocus?: boolean;
  /** Open while typing. Default `true`. */
  openOnInput?: boolean;
  /** What the input shows after a pick. Default `replace-input`. */
  selectionBehavior?: SelectionBehavior;
  /** Put the selected label back when the input loses focus. Default `true`. */
  restoreOnBlur?: boolean;
  /** Highlight the first match while typing. Default `true`. */
  autoHighlight?: boolean;
  /** Select the highlighted item on Tab. Default `false`. */
  autoSelectOnTab?: boolean;
  /** Accessible name of the trigger when an input is present. Default "Show options". */
  triggerLabel?: string;
  /** Mark the field invalid from outside (a form library's error state). */
  invalid?: boolean;
  /** Form field name. Renders a hidden native `<select>` so the value joins FormData. */
  name?: string;
  /** Id of the `<form>` the hidden field belongs to. */
  form?: string;
  /** Multiple mode: stop accepting picks at this many values. */
  maxSelected?: number;
  /** Announce adds and removes in a polite live region (multiple mode). Default `true`. */
  announce?: boolean;
  /** Override the live-region messages (for i18n). */
  messages?: Partial<SelectMessages>;
  placement?: Placement;
  offset?: number;
  /** Set `--omniselect-anchor-width` on the popover. Default `true`. */
  matchWidth?: boolean;
  /** `true` portals to `document.body`, an element portals there, `false` renders in place. */
  portal?: boolean | Element | null;
  children?: ReactNode;
};

export type SelectSingleProps<T> = SelectRootCommon<T> & {
  multiple?: false;
  /** Selected value. Controlled when defined. */
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
};

export type SelectMultipleProps<T> = SelectRootCommon<T> & {
  multiple: true;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
};

export type SelectRootProps<T> = SelectSingleProps<T> | SelectMultipleProps<T>;

type AnyValue<T> = T | null | T[];

/** State orchestrator. Renders a hidden form control and a live region, nothing visible. */
export function Root<T>(props: SelectRootProps<T>) {
  const {
    multiple = false,
    name,
    form,
    maxSelected,
    announce,
    messages,
    invalid,
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
    inputValue,
    defaultInputValue,
    onInputChange,
    filter,
    openOnFocus,
    openOnInput,
    selectionBehavior,
    restoreOnBlur,
    autoHighlight,
    autoSelectOnTab,
    triggerLabel,
    placement = "bottom-start",
    offset = 4,
    matchWidth = true,
    portal = true,
    children,
  } = props as SelectRootCommon<T> & {
    multiple?: boolean;
    value?: AnyValue<T>;
    defaultValue?: AnyValue<T>;
    onValueChange?: (value: AnyValue<T>) => void;
  };
  const rootId = `omniselect-${useId().replaceAll(":", "")}`;
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  const [controlEl, setControlEl] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  triggerRef.current = triggerEl;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const latest = useRef({ onOpenChange });
  latest.current = { onOpenChange };

  /** Combobox: the input. A search box inside the popover unmounts on close, so the trigger. */
  const machineRef = useRef<SelectMachine<T> | null>(null);
  const focusAfterClose = useCallback(() => {
    const target = machineRef.current?.focusTarget();
    (target === "input" ? (inputRef.current ?? triggerRef.current) : triggerRef.current)?.focus({
      preventScroll: true,
    });
  }, []);
  if (machineRef.current === null) {
    machineRef.current = createSelectMachine<T>({
      rootId,
      multiple,
      maxSelected,
      announce,
      messages,
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
      inputValue,
      defaultInputValue,
      onInputChange,
      filter,
      openOnFocus,
      openOnInput,
      selectionBehavior,
      restoreOnBlur,
      autoHighlight,
      autoSelectOnTab,
      triggerLabel,
      onOpenChange(next, reason) {
        latest.current.onOpenChange?.(next, reason);
        if (!next && (reason === "select" || reason === "escape" || reason === "tab")) {
          focusAfterClose();
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
      inputValue,
      onInputChange,
      filter,
      openOnFocus,
      openOnInput,
      selectionBehavior,
      restoreOnBlur,
      autoHighlight,
      autoSelectOnTab,
      triggerLabel,
      maxSelected,
      announce,
      messages,
      invalid,
    });
  });

  const focusTrigger = useCallback(() => triggerRef.current?.focus({ preventScroll: true }), []);
  const focusField = focusAfterClose;

  const context: SelectContextValue = {
    machine,
    triggerEl,
    setTriggerEl,
    controlEl,
    setControlEl,
    focusTrigger,
    focusField,
    inputRef,
    placement,
    offset,
    matchWidth,
    portal,
  };
  return (
    <SelectContext.Provider value={context}>
      {children}
      {name !== undefined || required ? (
        <HiddenSelect
          machine={machine}
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          multiple={multiple}
          focusField={focusField}
        />
      ) : null}
      {announce !== false ? <LiveRegion machine={machine} /> : null}
    </SelectContext.Provider>
  );
}

type HiddenSelectProps = {
  // biome-ignore lint/suspicious/noExplicitAny: the value type is erased
  machine: SelectMachine<any>;
  name: string | undefined;
  form: string | undefined;
  required: boolean;
  disabled: boolean;
  multiple: boolean;
  focusField: () => void;
};

/** Visually hidden native `<select>`: FormData, constraint validation, and form reset. */
function HiddenSelect({
  machine,
  name,
  form,
  required,
  disabled,
  multiple,
  focusField,
}: HiddenSelectProps) {
  const ref = useRef<HTMLSelectElement | null>(null);
  useSnapshot(machine, (m) => m.selectedKeys().join("\u0000"));
  const keys = machine.selectedKeys();
  useEffect(() => {
    const owner = ref.current?.form;
    if (!owner) {
      return;
    }
    // The browser resets controls after the event; restore the default value afterwards.
    const onReset = () => queueMicrotask(() => machine.reset());
    owner.addEventListener("reset", onReset);
    return () => owner.removeEventListener("reset", onReset);
  }, [machine]);
  return (
    <select
      ref={ref}
      data-part="hidden-select"
      name={name}
      form={form}
      multiple={multiple}
      required={required}
      disabled={disabled}
      tabIndex={-1}
      aria-hidden="true"
      style={visuallyHiddenStyle}
      value={multiple ? keys : (keys[0] ?? "")}
      onChange={(event) =>
        machine.setFromKeys(Array.from(event.currentTarget.selectedOptions).map((o) => o.value))
      }
      onInvalid={() => {
        machine.setInvalid(true);
        focusField();
      }}
    >
      {keys.map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}

/** Polite live region for add/remove announcements. */
// biome-ignore lint/suspicious/noExplicitAny: the value type is erased
function LiveRegion({ machine }: { machine: SelectMachine<any> }) {
  const message = useSnapshot(machine, (m) => m.store.get().announcement);
  return (
    <span
      data-part="live-region"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={visuallyHiddenStyle}
    >
      {message}
    </span>
  );
}
