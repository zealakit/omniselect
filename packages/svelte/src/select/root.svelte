<script lang="ts" generics="T">
import {
  createSelectMachine,
  type FilterFn,
  nextId,
  type SelectInputChangeReason,
  type SelectionBehavior,
  type SelectCloseReason,
  type SelectOpenReason,
  type SelectState,
} from "@zealakit/omniselect-core";
import type { Placement } from "@zealakit/overlay-svelte";
import { onDestroy, setContext, untrack, type Snippet } from "svelte";
import { SELECT_KEY, type SelectContext } from "./context.js";

type Props = {
  /** Selected value. Use `bind:value`, or `value` + `onValueChange`. */
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    reason: SelectOpenReason | SelectCloseReason,
  ) => void;
  /** Map a value to a stable string key. Default `String(value)`. */
  itemToKey?: (value: T) => string;
  /** Label for a selected value whose item is not mounted. */
  itemToString?: (value: T) => string;
  disabled?: boolean;
  required?: boolean;
  closeOnSelect?: boolean;
  allowsEmptyCollection?: boolean;
  loop?: boolean;
  /** Search text. Use `bind:inputValue`, or `inputValue` + `onInputChange`. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (value: string, reason: SelectInputChangeReason) => void;
  /** Custom filter, or `false` to filter outside (async search). */
  filter?: FilterFn<T> | false;
  openOnFocus?: boolean;
  openOnInput?: boolean;
  selectionBehavior?: SelectionBehavior;
  restoreOnBlur?: boolean;
  autoHighlight?: boolean;
  autoSelectOnTab?: boolean;
  /** Accessible name of the trigger when an input is present. */
  triggerLabel?: string;
  placement?: Placement;
  offset?: number;
  matchWidth?: boolean;
  portal?: boolean | string | Element | null;
  children?: Snippet;
};

let {
  value = $bindable(),
  defaultValue,
  onValueChange,
  open = $bindable(),
  defaultOpen,
  onOpenChange,
  itemToKey,
  itemToString,
  disabled = false,
  required = false,
  closeOnSelect,
  allowsEmptyCollection,
  loop,
  inputValue = $bindable(),
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
}: Props = $props();

let triggerEl: HTMLElement | null = $state(null);
let controlEl: HTMLElement | null = $state(null);
let inputEl: HTMLInputElement | null = $state(null);

const handleValue = (next: unknown) => {
  value = next as T | null;
  onValueChange?.(next as T | null);
};

const machine = untrack(() =>
  createSelectMachine<T>({
    rootId: nextId("omniselect"),
    itemToKey,
    itemToString,
    value: value as never,
    defaultValue: defaultValue as never,
    onValueChange: handleValue as never,
    open,
    defaultOpen,
    disabled,
    required,
    closeOnSelect,
    allowsEmptyCollection,
    loop,
    inputValue,
    defaultInputValue,
    onInputChange(next, reason) {
      inputValue = next;
      onInputChange?.(next, reason);
    },
    filter,
    openOnFocus,
    openOnInput,
    selectionBehavior,
    restoreOnBlur,
    autoHighlight,
    autoSelectOnTab,
    triggerLabel,
    onOpenChange(next, reason) {
      open = next;
      onOpenChange?.(next, reason);
      if (
        !next &&
        (reason === "select" || reason === "escape" || reason === "tab")
      ) {
        (inputEl ?? triggerEl)?.focus();
      }
    },
  }),
);
onDestroy(() => machine.destroy());

$effect.pre(() => {
  machine.sync({
    value: value as never,
    onValueChange: handleValue as never,
    open,
    disabled,
    required,
    closeOnSelect,
    allowsEmptyCollection,
    loop,
    inputValue,
    filter,
    openOnFocus,
    openOnInput,
    selectionBehavior,
    restoreOnBlur,
    autoHighlight,
    autoSelectOnTab,
    triggerLabel,
  });
});

const snapshot = {
  subscribe(run: (state: SelectState<unknown>) => void) {
    run(machine.store.get() as SelectState<unknown>);
    return machine.store.subscribe(run as never);
  },
};

const context: SelectContext = {
  machine,
  snapshot,
  get triggerEl() {
    return triggerEl;
  },
  get controlEl() {
    return controlEl;
  },
  get inputEl() {
    return inputEl;
  },
  setTriggerEl: (element) => {
    triggerEl = element;
  },
  setControlEl: (element) => {
    controlEl = element;
  },
  setInputEl: (element) => {
    inputEl = element;
  },
  focusTrigger: () => triggerEl?.focus(),
  focusField: () => (inputEl ?? triggerEl)?.focus(),
  props: {
    get placement() {
      return placement;
    },
    get offset() {
      return offset;
    },
    get matchWidth() {
      return matchWidth;
    },
    get portal() {
      return portal;
    },
  },
};
setContext(SELECT_KEY, context);
</script>

{@render children?.()}
