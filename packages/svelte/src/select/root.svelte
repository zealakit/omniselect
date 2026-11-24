<script lang="ts" generics="T">
  import {
    createSelectMachine,
    type FilterFn,
    nextId,
    type SelectInputChangeReason,
    type SelectMessages,
    type SelectionBehavior,
    visuallyHiddenStyle,
    type SelectCloseReason,
    type SelectOpenReason,
    type SelectState,
  } from "@zealakit/omniselect-core";
  import type { Placement } from "@zealakit/ui-engine/position";
  import { onDestroy, setContext, untrack, type Snippet } from "svelte";
  import { SELECT_KEY, type SelectContext } from "./context.js";

  type Props = {
    /** Selected value. Use `bind:value`, or `value` + `onValueChange`. */
    value?: T | null | T[];
    defaultValue?: T | null | T[];
    onValueChange?: (value: T | null | T[]) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, reason: SelectOpenReason | SelectCloseReason) => void;
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
    /** Mark the field invalid from outside (a form library's error state). */
    invalid?: boolean;
    /** Selects an array of values instead of one. */
    multiple?: boolean;
    /** Form field name. Renders a hidden native `<select>` so the value joins FormData. */
    name?: string;
    /** Id of the `<form>` the hidden field belongs to. */
    form?: string;
    /** Multiple mode: stop accepting picks at this many values. */
    maxSelected?: number;
    /** Announce adds and removes in a polite live region (multiple mode). Default `true`. */
    announce?: boolean;
    messages?: Partial<SelectMessages>;
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
    invalid,
    multiple = false,
    name,
    form,
    maxSelected,
    announce,
    messages,
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
    value = next as T | null | T[];
    onValueChange?.(next as T | null | T[]);
  };

  /** Combobox: the input. A search box inside the popover unmounts on close, so the trigger. */
  function focusAfterClose(): void {
    const target = machine.focusTarget();
    (target === "input" ? (inputEl ?? triggerEl) : triggerEl)?.focus({
      preventScroll: true,
    });
  }

  const machine = untrack(() =>
    createSelectMachine<T>({
      rootId: nextId("omniselect"),
      multiple,
      maxSelected,
      announce,
      messages,
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
        if (!next && (reason === "select" || reason === "escape" || reason === "tab")) {
          focusAfterClose();
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
      invalid,
      maxSelected,
      announce,
      messages,
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
    focusTrigger: () => triggerEl?.focus({ preventScroll: true }),
    focusField: () => focusAfterClose(),
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

  let hiddenEl: HTMLSelectElement | undefined = $state();
  const hiddenStyle = Object.entries(visuallyHiddenStyle)
    .map(([prop, value]) => `${prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`)
    .join(";");
  const keys = $derived.by(() => {
    void $snapshot;
    return machine.selectedKeys();
  });
  const announcement = $derived.by(() => {
    void $snapshot;
    return machine.store.get().announcement;
  });
  // `multiple` can be set after the options exist; select them again so none are dropped.
  $effect(() => {
    void keys;
    for (const option of Array.from(hiddenEl?.options ?? [])) option.selected = true;
  });
  $effect(() => {
    const owner = hiddenEl?.form;
    if (!owner) return;
    // The browser resets controls after the event; restore the default value afterwards.
    const onReset = () => queueMicrotask(() => machine.reset());
    owner.addEventListener("reset", onReset);
    return () => owner.removeEventListener("reset", onReset);
  });
</script>

{@render children?.()}
{#if name !== undefined || required}
  <select
    bind:this={hiddenEl}
    data-part="hidden-select"
    {name}
    {form}
    {multiple}
    {required}
    {disabled}
    tabindex="-1"
    aria-hidden="true"
    style={hiddenStyle}
    onchange={(event) =>
      machine.setFromKeys(
        Array.from((event.currentTarget as HTMLSelectElement).selectedOptions).map((o) => o.value),
      )}
    oninvalid={() => {
      machine.setInvalid(true);
      (inputEl ?? triggerEl)?.focus({ preventScroll: true });
    }}
  >
    {#each keys as key (key)}
      <option value={key} selected>{key}</option>
    {/each}
  </select>
{/if}
{#if announce !== false}
  <span
    data-part="live-region"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    style={hiddenStyle}>{announcement}</span
  >
{/if}
