import { type Collection, createCollection } from "./collection.js";
import { compareDomOrder } from "./dom-order.js";
import { createIds, type Ids } from "./ids.js";
import { first, last, next, pageDown, pageUp, prev } from "./navigation.js";
import {
  createSelection,
  type ItemToKey,
  type ItemToString,
  type SelectionModel,
} from "./selection.js";
import { createControllable, type Controllable } from "./store/controllable.js";
import { createStore, type Store } from "./store/store.js";
import { defaultFilter, type FilterFn } from "./filter.js";
import { createTypeahead, type Typeahead } from "./typeahead.js";

export type SelectValue<T> = T | null | T[];

export type SelectCloseReason =
  | "select"
  | "escape"
  | "tab"
  | "outside"
  | "toggle"
  | "blur"
  | "imperative"
  | "empty";

export type SelectOpenReason = "trigger" | "keyboard" | "imperative";

export type SelectInputChangeReason =
  | "input"
  | "select"
  | "clear"
  | "close"
  | "reset";

export type SelectionBehavior = "replace-input" | "keep-input" | "clear-input";

export type SelectMode = "select-only" | "combobox";

export type SelectMessages = {
  /** Announced when a value is added in multiple mode. */
  added: (label: string, count: number) => string;
  /** Announced when a value is removed in multiple mode. */
  removed: (label: string, count: number) => string;
  /** Announced when a page starts loading. */
  loading: () => string;
  /** Announced when a page finished loading. */
  loaded: (count: number) => string;
};

export const defaultMessages: SelectMessages = {
  added: (label, count) => `${label} added, ${count} selected`,
  removed: (label, count) => `${label} removed, ${count} selected`,
  loading: () => "Loading more results",
  loaded: (count) => `${count} results`,
};

export type SelectHighlightSource = "keyboard" | "pointer";

export type SelectState<T> = {
  open: boolean;
  highlightedKey: string | null;
  highlightSource: SelectHighlightSource | null;
  value: SelectValue<T>;
  inputValue: string;
  /** `combobox` while a `Select.Input` is mounted. */
  mode: SelectMode;
  /** Bumped when the collection changes, so adapters re-render derived output. */
  version: number;
  hasClear: boolean;
  hasLoading: boolean;
  /** Set by the hidden form control's `invalid` event; cleared on change. */
  invalid: boolean;
  /** Latest live-region message (multiple mode). */
  announcement: string;
};

export type SelectMachineOptions<T> = {
  rootId: string;
  multiple?: boolean;
  itemToKey?: ItemToKey<T>;
  itemToString?: ItemToString<T>;
  value?: SelectValue<T> | undefined;
  defaultValue?: SelectValue<T> | undefined;
  onValueChange?: (value: SelectValue<T>) => void;
  open?: boolean | undefined;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    reason: SelectOpenReason | SelectCloseReason,
  ) => void;
  disabled?: boolean;
  required?: boolean;
  closeOnSelect?: boolean;
  allowsEmptyCollection?: boolean;
  loop?: boolean;
  inputValue?: string | undefined;
  defaultInputValue?: string;
  onInputChange?: (value: string, reason: SelectInputChangeReason) => void;
  /** Custom filter, or `false` for manual filtering. Default: diacritic-insensitive contains. */
  filter?: FilterFn<T> | false;
  openOnFocus?: boolean;
  openOnInput?: boolean;
  selectionBehavior?: SelectionBehavior;
  restoreOnBlur?: boolean;
  autoHighlight?: boolean;
  autoSelectOnTab?: boolean;
  triggerLabel?: string;
  /** Multiple mode: stop accepting new picks at this many values. */
  maxSelected?: number;
  /** Live-region announcements in multiple mode. Default `true`. */
  announce?: boolean;
  messages?: Partial<SelectMessages>;
  typeaheadTimeout?: number;
  now?: () => number;
};

export type SelectProps<T> = Partial<
  Pick<
    SelectMachineOptions<T>,
    | "onValueChange"
    | "onOpenChange"
    | "disabled"
    | "required"
    | "closeOnSelect"
    | "allowsEmptyCollection"
    | "loop"
    | "onInputChange"
    | "filter"
    | "openOnFocus"
    | "openOnInput"
    | "selectionBehavior"
    | "restoreOnBlur"
    | "autoHighlight"
    | "autoSelectOnTab"
    | "triggerLabel"
    | "maxSelected"
    | "announce"
    | "messages"
  >
> & {
  value?: SelectValue<T> | undefined;
  open?: boolean | undefined;
  inputValue?: string | undefined;
};

/** The subset of a keyboard event the machine needs. */
export type KeyEventLike = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
};

export type KeyResult = { preventDefault: boolean };

export type Attrs = Record<string, string | undefined>;

export type SelectMachine<T> = {
  multiple: boolean;
  store: Store<SelectState<T>>;
  collection: Collection<T>;
  selection: SelectionModel<T>;
  ids: Ids;
  typeahead: Typeahead;
  itemToKey: ItemToKey<T>;
  sync: (props: SelectProps<T>) => void;
  isOpen: () => boolean;
  open: (
    reason?: SelectOpenReason,
    highlight?: "selected" | "first" | "last" | "first-visible" | "none",
  ) => void;
  close: (reason: SelectCloseReason) => void;
  toggle: () => void;
  highlight: (key: string | null, source?: SelectHighlightSource) => void;
  /** Select (or toggle, in multiple mode) the item with this key. */
  selectKey: (key: string, options?: { close?: boolean }) => void;
  clear: () => void;
  /** Replace the value without calling `onValueChange` (imperative APIs). */
  setValue: (value: SelectValue<T>) => void;
  /** Keyboard handling for the trigger (select-only mode). */
  onTriggerKeyDown: (event: KeyEventLike) => KeyResult;
  /** Called by `Select.Input` while mounted; switches the machine to combobox mode. */
  registerInput: () => () => void;
  /** Text typed into the input. `composing` defers filtering until composition ends. */
  onInput: (text: string, options?: { composing?: boolean }) => void;
  onInputKeyDown: (event: KeyEventLike) => KeyResult;
  onInputFocus: () => void;
  onInputClick: () => void;
  /** Blur: closes and, with `restoreOnBlur`, puts the selected label back. */
  onInputBlur: () => void;
  /** Remove the last selected value (multiple mode). */
  removeLast: () => void;
  /** Remove one value by key (multiple mode, chips). */
  removeKey: (key: string) => void;
  /** Restore `defaultValue` (and the input) after a form reset. */
  reset: () => void;
  setInvalid: (invalid: boolean) => void;
  /** Apply keys reported by the hidden form control (autofill); unknown keys are ignored. */
  setFromKeys: (keys: string[]) => void;
  /** Keys of the current value(s), in selection order. */
  selectedKeys: () => string[];
  /** Current value(s) with their keys and labels, in selection order. */
  selectedItems: () => { value: T; key: string; label: string }[];
  /** Select every visible, enabled item (multiple mode, no `maxSelected`). */
  selectAll: () => void;
  /** `true` when `maxSelected` values are already chosen. */
  maxReached: () => boolean;
  /** Keys of items that should render (the visible subset). */
  visibleKeys: () => string[];
  /** Label of one value: label cache, then `itemToString`, then its key. */
  labelOf: (value: T) => string;
  /** Labels of the current value(s), in selection order. */
  selectedLabels: () => string[];
  isSelected: (key: string) => boolean;
  /** Called by `Select.Clear` while mounted. */
  registerClear: () => () => void;
  setLoading: (loading: boolean) => void;
  /** Called by `Select.LoadMore` while mounted; `request` loads the next page without the sentinel. */
  registerLoadMore: (handle: { request: () => boolean }) => () => void;
  attrs: {
    trigger: () => Attrs;
    list: () => Attrs;
    item: (key: string) => Attrs;
    group: (id: string, hasLabel: boolean) => Attrs;
    groupLabel: (id: string) => Attrs;
    clear: (label: string) => Attrs;
    root: () => Attrs;
    input: () => Attrs;
  };
  destroy: () => void;
};

const bool = (on: boolean): string | undefined => (on ? "" : undefined);

export function createSelectMachine<T>(
  options: SelectMachineOptions<T>,
): SelectMachine<T> {
  const multiple = options.multiple ?? false;
  const itemToKey: ItemToKey<T> = options.itemToKey ?? ((v) => String(v));
  const selection = createSelection<T>({
    mode: multiple ? "multiple" : "single",
    itemToKey,
  });
  const ids = createIds(options.rootId);
  const collection = createCollection<T>({ compare: compareDomOrder });
  const typeahead = createTypeahead({
    timeout: options.typeaheadTimeout,
    now: options.now,
  });
  let props: Required<
    Pick<
      SelectProps<T>,
      | "disabled"
      | "required"
      | "closeOnSelect"
      | "allowsEmptyCollection"
      | "loop"
      | "openOnFocus"
      | "openOnInput"
      | "selectionBehavior"
      | "restoreOnBlur"
      | "autoHighlight"
      | "autoSelectOnTab"
      | "triggerLabel"
      | "announce"
    >
  > &
    Pick<
      SelectProps<T>,
      | "onValueChange"
      | "onOpenChange"
      | "onInputChange"
      | "filter"
      | "maxSelected"
    > & { messages: SelectMessages } = {
    disabled: options.disabled ?? false,
    required: options.required ?? false,
    closeOnSelect: options.closeOnSelect ?? !multiple,
    allowsEmptyCollection: options.allowsEmptyCollection ?? true,
    loop: options.loop ?? false,
    openOnFocus: options.openOnFocus ?? false,
    openOnInput: options.openOnInput ?? true,
    selectionBehavior:
      options.selectionBehavior ?? (multiple ? "clear-input" : "replace-input"),
    restoreOnBlur: options.restoreOnBlur ?? true,
    autoHighlight: options.autoHighlight ?? true,
    autoSelectOnTab: options.autoSelectOnTab ?? false,
    triggerLabel: options.triggerLabel ?? "Show options",
    announce: options.announce ?? true,
    maxSelected: options.maxSelected,
    messages: { ...defaultMessages, ...options.messages },
    onValueChange: options.onValueChange,
    onOpenChange: options.onOpenChange,
    onInputChange: options.onInputChange,
    filter: options.filter,
  };

  const defaultValue = options.defaultValue ?? selection.empty();
  const initialValue =
    options.value !== undefined ? options.value : defaultValue;
  const fallbackLabel = (value: T): string =>
    options.itemToString?.(value) ?? itemToKey(value);
  const initialInput =
    options.inputValue ??
    options.defaultInputValue ??
    (!multiple && initialValue !== null
      ? fallbackLabel(initialValue as T)
      : "");
  const store = createStore<SelectState<T>>({
    open: options.open ?? options.defaultOpen ?? false,
    highlightedKey: null,
    highlightSource: null,
    value: initialValue,
    inputValue: initialInput,
    mode: "select-only",
    version: 0,
    hasClear: false,
    hasLoading: false,
    invalid: false,
    announcement: "",
  });

  let reason: SelectOpenReason | SelectCloseReason = "imperative";
  let inputReason: SelectInputChangeReason = "input";
  /** Text the filter runs on; follows typing only, not the selected label. */
  let filterQuery = "";
  /** Highlight to apply once items register (the popover mounts after opening). */
  let pending: "selected" | "first" | "last" | "first-visible" | null = null;
  const sameKeys = (a: SelectValue<T>, b: SelectValue<T>) =>
    selection.keys(a).join("\u0000") === selection.keys(b).join("\u0000");

  const valueCtl: Controllable<SelectValue<T>> = createControllable<
    SelectValue<T>
  >({
    value: options.value,
    defaultValue,
    equals: sameKeys,
    onChange(next) {
      if (!valueCtl.isControlled()) {
        store.set({ value: next });
      }
      store.set({ invalid: false });
      props.onValueChange?.(next);
    },
  });
  const openCtl: Controllable<boolean> = createControllable<boolean>({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange(next) {
      if (!openCtl.isControlled()) {
        applyOpen(next);
      }
      props.onOpenChange?.(next, reason);
    },
  });

  const inputCtl: Controllable<string> = createControllable<string>({
    value: options.inputValue,
    defaultValue: initialInput,
    onChange(next) {
      if (!inputCtl.isControlled()) {
        store.set({ inputValue: next });
      }
      props.onInputChange?.(next, inputReason);
    },
  });

  const setInput = (text: string, why: SelectInputChangeReason): void => {
    inputReason = why;
    inputCtl.set(text);
  };

  const applyFilter = (): void => {
    const state = store.get();
    const active = state.open && state.mode === "combobox";
    collection.setFilter(
      active ? filterQuery : "",
      props.filter === undefined ? defaultFilter : props.filter,
    );
  };

  /** Text the input should show for the current selection. */
  const selectedText = (): string => {
    if (multiple) {
      return "";
    }
    const value = store.get().value;
    return value === null ? "" : machine.labelOf(value as T);
  };

  const restoreInput = (): void => {
    if (store.get().mode === "combobox" && props.restoreOnBlur) {
      setInput(selectedText(), "close");
    }
  };

  function applyOpen(open: boolean): void {
    store.set({
      open,
      highlightedKey: open ? store.get().highlightedKey : null,
      highlightSource: open ? store.get().highlightSource : null,
    });
    if (!open) {
      typeahead.reset();
      pending = null;
      filterQuery = "";
    }
    applyFilter();
  }

  // Items register one by one (1,000 items = 1,000 notifications). Re-render subscribers once
  // per microtask, or every subscriber would re-read the collection after every registration.
  let versionScheduled = false;
  const unsubscribeCollection = collection.subscribe(() => {
    if (!versionScheduled) {
      versionScheduled = true;
      queueMicrotask(() => {
        versionScheduled = false;
        store.set({ version: collection.version() });
      });
    }
    const state = store.get();
    if (
      state.open &&
      !props.allowsEmptyCollection &&
      !state.hasLoading &&
      collection.visible().length === 0
    ) {
      machine.close("empty");
    }
    if (state.open && pending !== null && state.highlightedKey === null) {
      schedulePending();
    }
    // Items register after the first paint; replace a fallback label with the real one.
    if (
      state.mode === "combobox" &&
      !multiple &&
      filterQuery === "" &&
      props.selectionBehavior === "replace-input" &&
      options.itemToString === undefined &&
      state.value !== null &&
      state.inputValue === itemToKey(state.value as T)
    ) {
      const label = machine.labelOf(state.value as T);
      if (label !== state.inputValue) {
        setInput(label, "select");
      }
    }
    if (state.highlightedKey !== null) {
      const item = collection.get(state.highlightedKey);
      if (
        !item ||
        item.disabled ||
        !collection.visible().some((v) => v.key === item.key)
      ) {
        store.set({ highlightedKey: null, highlightSource: null });
      }
    }
  });

  const maxReached = (): boolean =>
    multiple &&
    props.maxSelected !== undefined &&
    selection.keys(store.get().value).length >= props.maxSelected;

  const blockedByMax = (key: string): boolean =>
    maxReached() && !selection.keys(store.get().value).includes(key);

  const visibleNav = () =>
    collection.visible().map((item) => ({
      key: item.key,
      disabled: item.disabled || blockedByMax(item.key),
    }));

  const firstSelectedVisibleKey = (): string | null => {
    const keys = selection.keys(store.get().value);
    const visible = collection.visible();
    for (const key of keys) {
      const item = visible.find((v) => v.key === key);
      if (item && !item.disabled) {
        return key;
      }
    }
    return null;
  };

  let loadMore: { request: () => boolean } | null = null;
  /** Landing on the last item (or pressing past it) asks for the next page. */
  const reachEnd = (target: string | null): void => {
    if (loadMore && target !== null && target === last(visibleNav())) {
      loadMore.request();
    }
  };

  let pendingScheduled = false;
  /** Items register one by one in a commit; resolve after the whole batch. */
  const schedulePending = (): void => {
    if (pendingScheduled) {
      return;
    }
    pendingScheduled = true;
    queueMicrotask(() => {
      pendingScheduled = false;
      if (
        pending === null ||
        !store.get().open ||
        store.get().highlightedKey !== null
      ) {
        return;
      }
      const key = resolveHighlight(pending);
      if (key !== null) {
        pending = null;
        store.set({ highlightedKey: key, highlightSource: "keyboard" });
      }
    });
  };

  const resolveHighlight = (
    mode: "selected" | "first" | "last" | "first-visible" | null,
  ): string | null => {
    const nav = visibleNav();
    if (mode === "first-visible") {
      return first(nav);
    }
    if (mode === "selected") {
      return firstSelectedVisibleKey();
    }
    if (mode === "first") {
      return firstSelectedVisibleKey() ?? first(nav);
    }
    if (mode === "last") {
      return firstSelectedVisibleKey() ?? last(nav);
    }
    return null;
  };

  const setOpen = (
    next: boolean,
    why: SelectOpenReason | SelectCloseReason,
  ): void => {
    reason = why;
    openCtl.set(next);
  };

  const machine: SelectMachine<T> = {
    multiple,
    store,
    collection,
    selection,
    ids,
    typeahead,
    itemToKey,
    sync(next) {
      const { messages, ...rest } = next;
      props = { ...props, ...stripUndefined(rest) };
      if (messages) {
        props.messages = { ...props.messages, ...messages };
      }
      if (next.onValueChange !== undefined) {
        props.onValueChange = next.onValueChange;
      }
      if (next.onOpenChange !== undefined) {
        props.onOpenChange = next.onOpenChange;
      }
      if (valueCtl.isControlled() && next.value !== undefined) {
        const changed = !sameKeys(store.get().value, next.value);
        valueCtl.sync(next.value);
        store.set({ value: next.value });
        if (
          changed &&
          store.get().mode === "combobox" &&
          !multiple &&
          props.selectionBehavior === "replace-input"
        ) {
          setInput(selectedText(), "select");
        }
      }
      if (inputCtl.isControlled() && next.inputValue !== undefined) {
        inputCtl.sync(next.inputValue);
        store.set({ inputValue: next.inputValue });
      }
      if (next.filter !== undefined || "filter" in next) {
        applyFilter();
      }
      if (openCtl.isControlled() && next.open !== undefined) {
        openCtl.sync(next.open);
        applyOpen(next.open);
      }
    },
    isOpen: () => store.get().open,
    open(why = "imperative", highlight = "selected") {
      if (props.disabled || store.get().open) {
        return;
      }
      if (
        !props.allowsEmptyCollection &&
        !store.get().hasLoading &&
        collection.visible().length === 0
      ) {
        return;
      }
      pending = highlight === "none" ? null : highlight;
      const key = resolveHighlight(pending);
      if (key !== null) {
        pending = null;
      }
      store.set({
        highlightedKey: key,
        highlightSource: key === null ? null : "keyboard",
      });
      setOpen(true, why);
    },
    close(why) {
      if (!store.get().open) {
        return;
      }
      setOpen(false, why);
      if (why !== "select") {
        restoreInput();
      }
    },
    toggle() {
      if (store.get().open) {
        machine.close("toggle");
      } else {
        machine.open("trigger", "selected");
      }
    },
    highlight(key, source = "keyboard") {
      pending = null;
      if (key !== null) {
        const item = collection.get(key);
        if (!item || item.disabled) {
          return;
        }
      }
      store.set({
        highlightedKey: key,
        highlightSource: key === null ? null : source,
      });
    },
    selectKey(key, selectOptions) {
      const item = collection.get(key);
      if (!item || item.disabled || props.disabled || blockedByMax(key)) {
        return;
      }
      const current = store.get().value;
      const wasSelected = machine.isSelected(key);
      const next = multiple
        ? selection.toggle(current, item.value)
        : selection.select(current, item.value);
      valueCtl.set(next);
      if (multiple && props.announce) {
        const label = machine.labelOf(item.value);
        const count = selection.keys(next).length;
        store.set({
          announcement: wasSelected
            ? props.messages.removed(label, count)
            : props.messages.added(label, count),
        });
      }
      if (store.get().mode === "combobox") {
        const behavior = props.selectionBehavior;
        if (behavior === "replace-input" && !multiple) {
          setInput(machine.labelOf(item.value), "select");
        } else if (
          behavior === "clear-input" ||
          (multiple && behavior === "replace-input")
        ) {
          setInput("", "select");
        }
        filterQuery = "";
        applyFilter();
      }
      if (props.closeOnSelect && selectOptions?.close !== false) {
        machine.close("select");
      }
    },
    clear() {
      if (props.disabled) {
        return;
      }
      if (store.get().mode === "combobox") {
        setInput("", "clear");
        filterQuery = "";
        applyFilter();
      }
      if (!selection.isEmpty(store.get().value)) {
        valueCtl.set(selection.empty());
      }
    },
    removeLast() {
      const value = store.get().value;
      if (!Array.isArray(value) || value.length === 0 || props.disabled) {
        return;
      }
      machine.removeKey(itemToKey(value[value.length - 1] as T));
    },
    removeKey(key) {
      const value = store.get().value;
      if (!Array.isArray(value) || props.disabled) {
        return;
      }
      const target = value.find((item) => itemToKey(item as T) === key);
      if (target === undefined) {
        return;
      }
      valueCtl.set(value.filter((item) => itemToKey(item as T) !== key));
      if (props.announce) {
        store.set({
          announcement: props.messages.removed(
            machine.labelOf(target as T),
            value.length - 1,
          ),
        });
      }
    },
    reset() {
      store.set({ invalid: false });
      valueCtl.set(defaultValue);
      if (store.get().mode === "combobox") {
        filterQuery = "";
        setInput(
          options.defaultInputValue ??
            (!multiple && defaultValue !== null
              ? machine.labelOf(defaultValue as T)
              : ""),
          "reset",
        );
        applyFilter();
      }
    },
    setInvalid(invalid) {
      store.set({ invalid });
    },
    setFromKeys(keys) {
      const values = keys
        .map((key) => collection.get(key)?.value)
        .filter((value): value is T => value !== undefined);
      if (multiple) {
        valueCtl.set(values);
      } else if (values[0] !== undefined) {
        valueCtl.set(values[0]);
      }
    },
    selectedKeys: () => selection.keys(store.get().value),
    selectedItems() {
      const value = store.get().value;
      const list = Array.isArray(value) ? value : value === null ? [] : [value];
      return list.map((item) => ({
        value: item as T,
        key: itemToKey(item as T),
        label: machine.labelOf(item as T),
      }));
    },
    selectAll() {
      if (!multiple || props.disabled || props.maxSelected !== undefined) {
        return;
      }
      let current = store.get().value;
      for (const item of collection.visible()) {
        if (!item.disabled) {
          current = selection.select(current, item.value);
        }
      }
      valueCtl.set(current);
    },
    maxReached,
    setValue(next) {
      valueCtl.setSilently(next);
      store.set({ value: next });
    },
    onTriggerKeyDown(event) {
      const none: KeyResult = { preventDefault: false };
      const handled: KeyResult = { preventDefault: true };
      if (
        props.disabled ||
        event.isComposing ||
        store.get().mode === "combobox"
      ) {
        return none;
      }
      const state = store.get();
      const nav = visibleNav();
      const key = event.key;
      const printable =
        key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

      if (!state.open) {
        switch (key) {
          case "ArrowDown":
            machine.open("keyboard", "first");
            return handled;
          case "ArrowUp":
            if (event.altKey) {
              return none;
            }
            machine.open("keyboard", "last");
            return handled;
          case "Home":
            machine.open("keyboard", "first");
            return handled;
          case "End":
            machine.open("keyboard", "last");
            return handled;
          case "Enter":
            machine.open("keyboard", "first");
            return handled;
          case " ":
            if (typeahead.hasBuffer()) {
              break;
            }
            machine.open("keyboard", "first");
            return handled;
          case "Backspace":
          case "Delete":
            if (state.hasClear) {
              machine.clear();
              return handled;
            }
            return none;
          default:
        }
        if (printable || key === " ") {
          const match = typeahead.onKey(
            key,
            collection.visible(),
            firstSelectedVisibleKey(),
          );
          if (match !== null) {
            machine.selectKey(match);
          }
          return handled;
        }
        return none;
      }

      const from = state.highlightedKey;
      const extend = (target: string | null) => {
        machine.highlight(target);
        reachEnd(target);
        if (
          multiple &&
          event.shiftKey &&
          target !== null &&
          !machine.isSelected(target)
        ) {
          machine.selectKey(target);
        }
      };
      if (
        multiple &&
        (event.ctrlKey || event.metaKey) &&
        key.toLowerCase() === "a"
      ) {
        machine.selectAll();
        return handled;
      }
      switch (key) {
        case "ArrowDown":
          extend(next(nav, from, { wrap: props.loop }));
          return handled;
        case "ArrowUp":
          if (event.altKey) {
            if (from !== null) {
              machine.selectKey(from);
            }
            machine.close("select");
            return handled;
          }
          extend(prev(nav, from, { wrap: props.loop }));
          return handled;
        case "Home":
          machine.highlight(first(nav));
          return handled;
        case "End": {
          const target = last(nav);
          machine.highlight(target);
          reachEnd(target);
          return handled;
        }
        case "PageDown": {
          const target = pageDown(nav, from);
          machine.highlight(target);
          reachEnd(target);
          return handled;
        }
        case "PageUp":
          machine.highlight(pageUp(nav, from));
          return handled;
        case "Enter":
          if (from !== null) {
            machine.selectKey(from);
          } else {
            machine.close("select");
          }
          return handled;
        case " ":
          if (typeahead.hasBuffer()) {
            break;
          }
          if (from !== null) {
            machine.selectKey(from);
          }
          return handled;
        case "Tab":
          if (from !== null && !multiple) {
            machine.selectKey(from, { close: false });
          }
          machine.close("tab");
          return none;
        default:
      }
      if (printable || key === " ") {
        const match = typeahead.onKey(key, collection.visible(), from);
        if (match !== null) {
          machine.highlight(match);
        }
        return handled;
      }
      return none;
    },
    registerInput() {
      store.set({ mode: "combobox" });
      applyFilter();
      return () => {
        store.set({ mode: "select-only" });
        applyFilter();
      };
    },
    onInput(text, inputOptions) {
      if (props.disabled) {
        return;
      }
      setInput(text, "input");
      if (inputOptions?.composing) {
        return;
      }
      filterQuery = text;
      pending = props.autoHighlight && text !== "" ? "first-visible" : null;
      if (!store.get().open) {
        if (props.openOnInput) {
          machine.open("keyboard", "none");
          pending = props.autoHighlight && text !== "" ? "first-visible" : null;
        }
      } else {
        applyFilter();
        const current = store.get().highlightedKey;
        if (current !== null && !collection.isVisible(current)) {
          store.set({ highlightedKey: null, highlightSource: null });
        }
      }
      if (pending !== null && store.get().open) {
        schedulePending();
      }
    },
    onInputKeyDown(event) {
      const none: KeyResult = { preventDefault: false };
      const handled: KeyResult = { preventDefault: true };
      if (props.disabled || event.isComposing) {
        return none;
      }
      const state = store.get();
      const nav = visibleNav();
      const key = event.key;
      if (key === "Backspace" && multiple && state.inputValue === "") {
        machine.removeLast();
        return none;
      }
      if (!state.open) {
        switch (key) {
          case "ArrowDown":
            machine.open("keyboard", event.altKey ? "none" : "first");
            return handled;
          case "ArrowUp":
            if (event.altKey) {
              return none;
            }
            machine.open("keyboard", "last");
            return handled;
          case "Escape":
            if (state.inputValue !== "") {
              setInput("", "clear");
              filterQuery = "";
              return handled;
            }
            return none;
          default:
            return none;
        }
      }
      const from = state.highlightedKey;
      switch (key) {
        case "ArrowDown": {
          const target = next(nav, from, { wrap: props.loop });
          machine.highlight(target);
          reachEnd(target);
          return handled;
        }
        case "ArrowUp":
          if (event.altKey) {
            return none;
          }
          machine.highlight(prev(nav, from, { wrap: props.loop }));
          return handled;
        case "PageDown": {
          const target = pageDown(nav, from);
          machine.highlight(target);
          reachEnd(target);
          return handled;
        }
        case "PageUp":
          machine.highlight(pageUp(nav, from));
          return handled;
        case "Enter":
          if (from !== null) {
            machine.selectKey(from);
            return handled;
          }
          return none;
        case "Tab":
          if (props.autoSelectOnTab && from !== null && !multiple) {
            machine.selectKey(from, { close: false });
          }
          machine.close("tab");
          return none;
        default:
          return none;
      }
    },
    onInputFocus() {
      if (props.openOnFocus && !store.get().open) {
        machine.open("keyboard", "none");
      }
    },
    onInputClick() {
      if (!store.get().open) {
        machine.open("trigger", "selected");
      }
    },
    onInputBlur() {
      if (store.get().open) {
        machine.close("blur");
      } else {
        restoreInput();
      }
    },
    visibleKeys: () => collection.visible().map((item) => item.key),
    labelOf: (value) =>
      collection.labelOf(
        itemToKey(value),
        () => options.itemToString?.(value) ?? itemToKey(value),
      ),
    selectedLabels() {
      const value = store.get().value;
      const list = Array.isArray(value) ? value : value === null ? [] : [value];
      return list.map((item) => machine.labelOf(item as T));
    },
    isSelected: (key) => selection.keys(store.get().value).includes(key),
    registerClear() {
      store.set({ hasClear: true });
      return () => store.set({ hasClear: false });
    },
    setLoading(loading) {
      const was = store.get().hasLoading;
      store.set({ hasLoading: loading });
      if (props.announce && was !== loading) {
        store.set({
          announcement: loading
            ? props.messages.loading()
            : props.messages.loaded(collection.visible().length),
        });
      }
    },
    registerLoadMore(handle) {
      loadMore = handle;
      return () => {
        if (loadMore === handle) {
          loadMore = null;
        }
      };
    },
    attrs: {
      root: () => ({
        "data-state": store.get().open ? "open" : "closed",
        "data-disabled": bool(props.disabled),
        "data-invalid": bool(store.get().invalid),
      }),
      trigger: () => {
        const state = store.get();
        const listMounted = state.open;
        if (state.mode === "combobox") {
          return {
            id: ids.trigger,
            "aria-haspopup": "listbox",
            "aria-expanded": state.open ? "true" : "false",
            "aria-controls": listMounted ? ids.listbox : undefined,
            "aria-label": props.triggerLabel,
            tabindex: "-1",
            "aria-disabled": props.disabled ? "true" : undefined,
            "data-state": state.open ? "open" : "closed",
            "data-disabled": bool(props.disabled),
          };
        }
        return {
          id: ids.trigger,
          role: "combobox",
          "aria-haspopup": "listbox",
          "aria-expanded": state.open ? "true" : "false",
          "aria-controls": listMounted ? ids.listbox : undefined,
          "aria-activedescendant":
            state.open && state.highlightedKey !== null
              ? ids.item(state.highlightedKey)
              : undefined,
          "aria-labelledby": `${ids.label} ${ids.trigger}`,
          "aria-required": props.required ? "true" : undefined,
          "aria-invalid": state.invalid ? "true" : undefined,
          "aria-disabled": props.disabled ? "true" : undefined,
          "data-state": state.open ? "open" : "closed",
          "data-disabled": bool(props.disabled),
          "data-invalid": bool(state.invalid),
          "data-placeholder": bool(!multiple && selection.isEmpty(state.value)),
        };
      },
      input: () => {
        const state = store.get();
        return {
          id: ids.input,
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-haspopup": "listbox",
          "aria-expanded": state.open ? "true" : "false",
          "aria-controls": state.open ? ids.listbox : undefined,
          "aria-activedescendant":
            state.open && state.highlightedKey !== null
              ? ids.item(state.highlightedKey)
              : undefined,
          "aria-labelledby": ids.label,
          "aria-required": props.required ? "true" : undefined,
          "aria-invalid": state.invalid ? "true" : undefined,
          "aria-disabled": props.disabled ? "true" : undefined,
          autocomplete: "off",
          spellcheck: "false",
          "data-state": state.open ? "open" : "closed",
          "data-disabled": bool(props.disabled),
          "data-invalid": bool(state.invalid),
        };
      },
      list: () => ({
        id: ids.listbox,
        role: "listbox",
        tabindex: "-1",
        "aria-labelledby": ids.label,
        "aria-multiselectable": multiple ? "true" : undefined,
        "aria-busy": store.get().hasLoading ? "true" : undefined,
        "data-state": store.get().open ? "open" : "closed",
      }),
      item: (key) => {
        const item = collection.get(key);
        const state = store.get();
        const selected = machine.isSelected(key);
        const highlighted = state.highlightedKey === key;
        const disabled = item?.disabled === true || blockedByMax(key);
        return {
          id: ids.item(key),
          role: "option",
          "aria-selected": selected ? "true" : "false",
          "aria-disabled": disabled ? "true" : undefined,
          "data-highlighted": bool(highlighted),
          "data-selected": bool(selected),
          "data-disabled": bool(disabled),
          "data-state": selected ? "checked" : "unchecked",
        };
      },
      group: (id, hasLabel) => ({
        id: ids.group(id),
        role: "group",
        "aria-labelledby": hasLabel ? ids.groupLabel(id) : undefined,
      }),
      groupLabel: (id) => ({ id: ids.groupLabel(id), role: "presentation" }),
      clear: (label) => ({
        "aria-label": label,
        tabindex: "-1",
        "data-disabled": bool(props.disabled),
      }),
    },
    destroy() {
      unsubscribeCollection();
    },
  };
  return machine;
}

function stripUndefined<T extends object>(input: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(input) as (keyof T)[]) {
    if (input[key] !== undefined) {
      out[key] = input[key];
    }
  }
  return out;
}
