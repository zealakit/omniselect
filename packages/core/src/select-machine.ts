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

export type SelectHighlightSource = "keyboard" | "pointer";

export type SelectState<T> = {
  open: boolean;
  highlightedKey: string | null;
  highlightSource: SelectHighlightSource | null;
  value: SelectValue<T>;
  /** Bumped when the collection changes, so adapters re-render derived output. */
  version: number;
  hasClear: boolean;
  hasLoading: boolean;
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
  >
> & { value?: SelectValue<T> | undefined; open?: boolean | undefined };

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
    highlight?: "selected" | "first" | "last" | "none",
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
  attrs: {
    trigger: () => Attrs;
    list: () => Attrs;
    item: (key: string) => Attrs;
    group: (id: string, hasLabel: boolean) => Attrs;
    groupLabel: (id: string) => Attrs;
    clear: (label: string) => Attrs;
    root: () => Attrs;
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
    >
  > &
    Pick<SelectProps<T>, "onValueChange" | "onOpenChange"> = {
    disabled: options.disabled ?? false,
    required: options.required ?? false,
    closeOnSelect: options.closeOnSelect ?? !multiple,
    allowsEmptyCollection: options.allowsEmptyCollection ?? true,
    loop: options.loop ?? false,
    onValueChange: options.onValueChange,
    onOpenChange: options.onOpenChange,
  };

  const defaultValue = options.defaultValue ?? selection.empty();
  const store = createStore<SelectState<T>>({
    open: options.open ?? options.defaultOpen ?? false,
    highlightedKey: null,
    highlightSource: null,
    value: options.value !== undefined ? options.value : defaultValue,
    version: 0,
    hasClear: false,
    hasLoading: false,
  });

  let reason: SelectOpenReason | SelectCloseReason = "imperative";
  /** Highlight to apply once items register (the popover mounts after opening). */
  let pending: "selected" | "first" | "last" | null = null;
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

  function applyOpen(open: boolean): void {
    store.set({
      open,
      highlightedKey: open ? store.get().highlightedKey : null,
      highlightSource: open ? store.get().highlightSource : null,
    });
    if (!open) {
      typeahead.reset();
      pending = null;
    }
  }

  const unsubscribeCollection = collection.subscribe(() => {
    store.set({ version: collection.version() });
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

  const visibleNav = () =>
    collection
      .visible()
      .map((item) => ({ key: item.key, disabled: item.disabled }));

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
    mode: "selected" | "first" | "last" | null,
  ): string | null => {
    const nav = visibleNav();
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
      props = { ...props, ...stripUndefined(next) };
      if (next.onValueChange !== undefined) {
        props.onValueChange = next.onValueChange;
      }
      if (next.onOpenChange !== undefined) {
        props.onOpenChange = next.onOpenChange;
      }
      if (valueCtl.isControlled() && next.value !== undefined) {
        valueCtl.sync(next.value);
        store.set({ value: next.value });
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
      if (!item || item.disabled || props.disabled) {
        return;
      }
      const current = store.get().value;
      const next = multiple
        ? selection.toggle(current, item.value)
        : selection.select(current, item.value);
      valueCtl.set(next);
      if (props.closeOnSelect && selectOptions?.close !== false) {
        machine.close("select");
      }
    },
    clear() {
      if (props.disabled || selection.isEmpty(store.get().value)) {
        return;
      }
      valueCtl.set(selection.empty());
    },
    setValue(next) {
      valueCtl.setSilently(next);
      store.set({ value: next });
    },
    onTriggerKeyDown(event) {
      const none: KeyResult = { preventDefault: false };
      const handled: KeyResult = { preventDefault: true };
      if (props.disabled || event.isComposing) {
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
      switch (key) {
        case "ArrowDown":
          machine.highlight(next(nav, from, { wrap: props.loop }));
          return handled;
        case "ArrowUp":
          if (event.altKey) {
            if (from !== null) {
              machine.selectKey(from);
            }
            machine.close("select");
            return handled;
          }
          machine.highlight(prev(nav, from, { wrap: props.loop }));
          return handled;
        case "Home":
          machine.highlight(first(nav));
          return handled;
        case "End":
          machine.highlight(last(nav));
          return handled;
        case "PageDown":
          machine.highlight(pageDown(nav, from));
          return handled;
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
      store.set({ hasLoading: loading });
    },
    attrs: {
      root: () => ({
        "data-state": store.get().open ? "open" : "closed",
        "data-disabled": bool(props.disabled),
      }),
      trigger: () => {
        const state = store.get();
        const listMounted = state.open;
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
          "aria-disabled": props.disabled ? "true" : undefined,
          "data-state": state.open ? "open" : "closed",
          "data-disabled": bool(props.disabled),
          "data-placeholder": bool(!multiple && selection.isEmpty(state.value)),
        };
      },
      list: () => ({
        id: ids.listbox,
        role: "listbox",
        tabindex: "-1",
        "aria-labelledby": ids.label,
        "aria-multiselectable": multiple ? "true" : undefined,
        "data-state": store.get().open ? "open" : "closed",
      }),
      item: (key) => {
        const item = collection.get(key);
        const state = store.get();
        const selected = machine.isSelected(key);
        const highlighted = state.highlightedKey === key;
        const disabled = item?.disabled === true;
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
