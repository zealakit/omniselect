import {
  type Attrs,
  createLoadMoreGuard,
  createSelectMachine,
  type FilterFn,
  findScrollParent,
  getItemText,
  getPopoverVars,
  nextId,
  type SelectCloseReason,
  type SelectInputChangeReason,
  type SelectMessages,
  type SelectionBehavior,
  type SelectOpenReason,
  visuallyHiddenStyle,
} from "@zealakit/omniselect-core";
import {
  createOverlay,
  type DismissReason,
  type Overlay,
  type Placement,
} from "@zealakit/overlay-vanilla";

export type SelectOptions = {
  /** Keys are strings. An array of strings with `multiple`. */
  defaultValue?: string | string[] | null;
  onValueChange?: (value: string | string[] | null) => void;
  /** Select several keys; the value becomes an array. */
  multiple?: boolean;
  /** Form field name. A hidden native `<select>` is added inside the root so the value joins FormData. */
  name?: string;
  form?: string;
  /** Multiple mode: stop accepting picks at this many values. */
  maxSelected?: number;
  /** Announce adds and removes in a polite live region (multiple mode). Default `true`. */
  announce?: boolean;
  messages?: Partial<SelectMessages>;
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
  placement?: Placement;
  offset?: number;
  matchWidth?: boolean;
  /** Where the popover is moved while open. `null` keeps it in place. Default `document.body`. */
  portal?: Element | null;
  /** Called when the next page should be fetched (needs a `[data-part="load-more"]` sentinel in the list). */
  onLoadMore?: () => void;
  /** Accessible name of the Clear button. Default "Clear selection". */
  clearLabel?: string;
  /** Used when a `[data-part="input"]` is present. */
  defaultInputValue?: string;
  onInputChange?: (value: string, reason: SelectInputChangeReason) => void;
  /** Custom filter, or `false` to filter outside (async search). */
  filter?: FilterFn<string> | false;
  openOnFocus?: boolean;
  openOnInput?: boolean;
  selectionBehavior?: SelectionBehavior;
  restoreOnBlur?: boolean;
  autoHighlight?: boolean;
  autoSelectOnTab?: boolean;
  /** Accessible name of the trigger when an input is present. */
  triggerLabel?: string;
};

export type SelectHandle = {
  getValue: () => string | string[] | null;
  /** Select by key. Does not call `onValueChange`. */
  setValue: (value: string | string[] | null) => void;
  open: () => void;
  close: () => void;
  /** Re-read items and groups after you changed the markup. */
  /** Tell the select whether a page is loading and whether more pages exist. */
  setLoadMore: (state: { isLoading?: boolean; hasMore?: boolean }) => void;
  /** Mark the field invalid from outside (`data-invalid`, `aria-invalid`). */
  setInvalid: (invalid: boolean) => void;
  refresh: () => void;
  destroy: () => void;
};

const dismissReasons: Record<DismissReason, SelectCloseReason> = {
  "escape-key": "escape",
  "outside-press": "outside",
  "reference-press": "toggle",
  imperative: "imperative",
};

function applyAttrs(element: Element | null | undefined, attrs: Attrs): void {
  if (!element) {
    return;
  }
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
}

const toggleAttr = (
  element: Element | null | undefined,
  name: string,
  on: boolean,
) => {
  if (!element) {
    return;
  }
  if (on) {
    element.setAttribute(name, "");
  } else {
    element.removeAttribute(name);
  }
};

/**
 * Enhance markup made of `data-part` elements: `label`, `control`, `trigger`,
 * `value`, `clear`, `indicator`, `popover` > `list` > `item` (`data-value`),
 * `group`, `group-label`, `item-indicator`, and `empty`.
 */
export function createSelect(
  root: HTMLElement,
  options: SelectOptions = {},
): SelectHandle {
  const part = (name: string) =>
    root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  const trigger = part("trigger");
  const popover = part("popover");
  const list = part("list");
  if (!trigger || !popover || !list) {
    throw new Error(
      'createSelect: root needs [data-part="trigger"], "popover", and "list" elements.',
    );
  }
  const control = part("control");
  const valueEl = part("value");
  const inputEl = part("input") as HTMLInputElement | null;
  // Search-in-popover: the input lives in the popover, which is hidden while closed.
  const inputInPopover = inputEl !== null && popover.contains(inputEl);
  /** Combobox: the input. A search box inside the popover is hidden on close, so the trigger. */
  const focusAfterClose = () =>
    (inputEl && !inputInPopover ? inputEl : trigger).focus();
  const clearEl = part("clear");
  const indicator = part("indicator");
  const label = part("label");
  const empty = part("empty");
  const placeholder = valueEl?.textContent ?? "";
  const anchor = control ?? trigger;
  const portal = options.portal === undefined ? document.body : options.portal;

  const machine = createSelectMachine<string>({
    rootId: nextId("omniselect"),
    multiple: options.multiple,
    maxSelected: options.maxSelected,
    announce: options.announce,
    messages: options.messages,
    defaultValue: (options.defaultValue ??
      (options.multiple ? [] : null)) as never,
    onValueChange: (value) =>
      options.onValueChange?.(value as string | string[] | null),
    defaultOpen: options.defaultOpen,
    disabled: options.disabled,
    required: options.required,
    closeOnSelect: options.closeOnSelect,
    allowsEmptyCollection: options.allowsEmptyCollection,
    loop: options.loop,
    defaultInputValue: options.defaultInputValue,
    onInputChange: options.onInputChange,
    filter: options.filter,
    openOnFocus: options.openOnFocus,
    openOnInput: options.openOnInput,
    selectionBehavior: options.selectionBehavior,
    restoreOnBlur: options.restoreOnBlur,
    autoHighlight: options.autoHighlight,
    autoSelectOnTab: options.autoSelectOnTab,
    triggerLabel: options.triggerLabel,
    onOpenChange(open, reason) {
      options.onOpenChange?.(open, reason);
      if (
        !open &&
        (reason === "select" || reason === "escape" || reason === "tab")
      ) {
        focusAfterClose();
      }
    },
  });
  if (label) {
    label.id = machine.ids.label;
  }

  let composing = false;
  let overlay: Overlay | null = null;
  const unregister: (() => void)[] = [];

  const registerItems = () => {
    for (const off of unregister.splice(0)) {
      off();
    }
    for (const group of Array.from(
      popover.querySelectorAll<HTMLElement>('[data-part="group"]'),
    )) {
      const id = group.id || nextId("group");
      group.dataset.groupId = id;
      unregister.push(
        machine.collection.registerGroup(id, {
          disabled: group.hasAttribute("data-disabled"),
        }),
      );
    }
    for (const el of Array.from(
      list.querySelectorAll<HTMLElement>('[data-part="item"]'),
    )) {
      const key = el.dataset.value ?? "";
      const group = el.closest<HTMLElement>('[data-part="group"]');
      unregister.push(
        machine.collection.register({
          key,
          value: key,
          textValue: el.dataset.textValue ?? getItemText(el),
          disabled:
            el.hasAttribute("data-disabled") ||
            el.getAttribute("aria-disabled") === "true",
          groupId: group?.dataset.groupId ?? null,
          node: el,
        }),
      );
    }
  };

  const itemElements = () =>
    Array.from(list.querySelectorAll<HTMLElement>('[data-part="item"]'));

  let renderForm: () => void = () => {};
  const render = () => {
    const state = machine.store.get();
    const open = state.open;
    applyAttrs(trigger, machine.attrs.trigger());
    if (trigger instanceof HTMLButtonElement) {
      trigger.disabled = trigger.getAttribute("aria-disabled") === "true";
    }
    applyAttrs(control, machine.attrs.root());
    if (inputEl) {
      applyAttrs(inputEl, machine.attrs.input());
      if (inputEl.value !== state.inputValue && !composing) {
        inputEl.value = state.inputValue;
      }
    }
    applyAttrs(list, machine.attrs.list());
    applyAttrs(
      clearEl,
      machine.attrs.clear(options.clearLabel ?? "Clear selection"),
    );
    indicator?.setAttribute("aria-hidden", "true");
    indicator?.setAttribute("data-state", open ? "open" : "closed");
    popover.setAttribute("data-state", open ? "open" : "closed");
    const labels = machine.selectedLabels();
    if (valueEl) {
      valueEl.textContent = labels.length > 0 ? labels.join(", ") : placeholder;
      toggleAttr(valueEl, "data-placeholder", labels.length === 0);
    }
    if (clearEl) {
      clearEl.hidden = machine.selection.isEmpty(state.value);
    }
    if (empty) {
      // While a page is loading the list is not empty yet.
      empty.hidden =
        machine.collection.visible().length !== 0 || state.hasLoading;
      empty.setAttribute("role", "option");
      empty.setAttribute("aria-disabled", "true");
      empty.setAttribute("aria-selected", "false");
    }
    for (const el of itemElements()) {
      const key = el.dataset.value ?? "";
      // Items register one by one; leave the rest untouched until their turn.
      if (!machine.collection.get(key)) {
        continue;
      }
      el.hidden = !machine.collection.isVisible(key);
      applyAttrs(el, machine.attrs.item(key));
      const selected = machine.isSelected(key);
      for (const mark of Array.from(
        el.querySelectorAll<HTMLElement>('[data-part="item-indicator"]'),
      )) {
        mark.hidden = !selected;
        mark.setAttribute("aria-hidden", "true");
        mark.setAttribute("data-state", selected ? "checked" : "unchecked");
      }
    }
    for (const group of Array.from(
      popover.querySelectorAll<HTMLElement>('[data-part="group"]'),
    )) {
      const id = group.dataset.groupId ?? "";
      const groupLabel = group.querySelector<HTMLElement>(
        '[data-part="group-label"]',
      );
      applyAttrs(group, machine.attrs.group(id, groupLabel !== null));
      group.hidden = !machine.collection.groupHasVisible(id);
      applyAttrs(groupLabel, machine.attrs.groupLabel(id));
    }
    const highlighted = state.highlightedKey;
    if (open && highlighted !== null && state.highlightSource === "keyboard") {
      const el = itemElements().find(
        (item) => item.dataset.value === highlighted,
      );
      el?.scrollIntoView?.({ block: "nearest" });
    }
    renderForm();
    // Keep the overlay in step with the machine.
    if (overlay && overlay.isOpen !== open) {
      if (open) {
        overlay.open();
      } else {
        overlay.close("imperative");
      }
    }
  };

  const updateVars = () => {
    if (!overlay) {
      return;
    }
    const vars = getPopoverVars(
      anchor.getBoundingClientRect(),
      overlay.placement,
      window.innerHeight,
      options.offset ?? 4,
    );
    if (options.matchWidth !== false) {
      popover.style.setProperty("--omniselect-anchor-width", `${vars.width}px`);
    }
    popover.style.setProperty(
      "--omniselect-available-height",
      `${vars.availableHeight}px`,
    );
    const [side = "bottom", align = "center"] = overlay.placement.split("-");
    popover.dataset.side = side;
    popover.dataset.align = align;
  };

  overlay = createOverlay({
    reference: anchor,
    floating: popover,
    placement: options.placement ?? "bottom-start",
    offset: options.offset ?? 4,
    portal,
    boundaries: [control, trigger],
    trigger: "none",
    defaultOpen: false,
    dismissOnEscape: true,
    dismissOnOutsidePress: true,
    onOpenChange: (open, reason) => {
      if (!open && reason && reason !== "imperative") {
        machine.close(dismissReasons[reason]);
      }
      if (open) {
        void overlay?.update().then(updateVars);
      }
    },
  });

  // Form participation: a visually hidden native <select> (FormData, validation, reset).
  let hidden: HTMLSelectElement | null = null;
  let live: HTMLElement | null = null;
  let offReset = () => {};
  if (options.name !== undefined || options.required) {
    hidden = document.createElement("select");
    hidden.setAttribute("data-part", "hidden-select");
    hidden.tabIndex = -1;
    hidden.setAttribute("aria-hidden", "true");
    Object.assign(hidden.style, visuallyHiddenStyle);
    if (options.name !== undefined) hidden.name = options.name;
    if (options.form !== undefined) hidden.setAttribute("form", options.form);
    hidden.multiple = options.multiple ?? false;
    hidden.required = options.required ?? false;
    hidden.disabled = options.disabled ?? false;
    hidden.addEventListener("change", () => {
      machine.setFromKeys(
        Array.from(hidden?.selectedOptions ?? []).map((o) => o.value),
      );
    });
    hidden.addEventListener("invalid", () => {
      machine.setInvalid(true);
      (inputEl ?? trigger).focus();
    });
    root.append(hidden);
    const owner = hidden.form;
    // The browser resets controls after the event; restore the default value afterwards.
    const onReset = () => queueMicrotask(() => machine.reset());
    owner?.addEventListener("reset", onReset);
    offReset = () => owner?.removeEventListener("reset", onReset);
  }
  if (options.announce !== false) {
    live = document.createElement("span");
    live.setAttribute("data-part", "live-region");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    Object.assign(live.style, visuallyHiddenStyle);
    root.append(live);
  }
  renderForm = () => {
    if (hidden) {
      hidden.replaceChildren(
        ...machine.selectedKeys().map((key) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = key;
          option.selected = true;
          return option;
        }),
      );
    }
    if (live) {
      live.textContent = machine.store.get().announcement;
    }
  };

  // Async pagination: a sentinel element, a duplicate-request guard, and an observer.
  const sentinel = list.querySelector<HTMLElement>('[data-part="load-more"]');
  const guard = createLoadMoreGuard();
  let loadState = { isLoading: false, hasMore: false };
  let sentinelObserver: IntersectionObserver | null = null;
  const syncGuard = () =>
    guard.sync({
      open: machine.isOpen(),
      hasMore: loadState.hasMore,
      isLoading: loadState.isLoading,
      onLoadMore: () => options.onLoadMore?.(),
    });
  let offLoadMore = () => {};
  if (sentinel) {
    sentinel.setAttribute("aria-hidden", "true");
    offLoadMore = machine.registerLoadMore({ request: () => guard.request() });
  }
  const observeSentinel = () => {
    sentinelObserver?.disconnect();
    sentinelObserver = null;
    if (
      !sentinel ||
      !machine.isOpen() ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    sentinelObserver = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) guard.setIntersecting(last.isIntersecting);
      },
      {
        root: findScrollParent(sentinel, popover),
        rootMargin: "0px 0px 64px 0px",
      },
    );
    sentinelObserver.observe(sentinel);
  };
  // observe() reports the current state again: loads the next page when the sentinel is still visible.
  const remeasure = () => {
    if (sentinelObserver && sentinel && !loadState.isLoading) {
      sentinelObserver.unobserve(sentinel);
      sentinelObserver.observe(sentinel);
    }
  };
  let wasOpen = machine.isOpen();
  const renderLoad = () => {
    if (sentinel) {
      toggleAttr(sentinel, "data-loading", loadState.isLoading);
      toggleAttr(sentinel, "data-has-more", loadState.hasMore);
    }
    if (machine.isOpen() !== wasOpen) {
      wasOpen = machine.isOpen();
      observeSentinel();
      if (inputEl && inputInPopover) {
        if (wasOpen) {
          offInput = machine.registerInput({ inPopover: true });
          queueMicrotask(() => inputEl.focus());
        } else {
          offInput();
        }
      }
    }
    syncGuard();
  };

  const unsubscribe = machine.store.subscribe(() => {
    render();
    renderLoad();
  });
  const offCollection = machine.collection.subscribe(render);

  const onTriggerClick = () => {
    machine.toggle();
    if (inputEl && !inputInPopover) {
      inputEl.focus();
    }
  };
  const onInputEvent = () => {
    if (inputEl) {
      machine.onInput(inputEl.value, { composing });
      if (!composing && inputEl.value !== machine.store.get().inputValue) {
        inputEl.value = machine.store.get().inputValue;
      }
    }
  };
  const onCompositionStart = () => {
    composing = true;
  };
  const onCompositionEnd = () => {
    composing = false;
    if (inputEl) {
      machine.onInput(inputEl.value);
    }
  };
  const onInputKeyDown = (event: KeyboardEvent) => {
    const result = machine.onInputKeyDown({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing || composing,
    });
    if (result.preventDefault) {
      event.preventDefault();
    }
  };
  const onInputFocus = () => machine.onInputFocus();
  const onInputClick = () => machine.onInputClick();
  const onInputBlur = () => machine.onInputBlur();
  const onKeyDown = (event: KeyboardEvent) => {
    const result = machine.onTriggerKeyDown(event);
    if (result.preventDefault) {
      event.preventDefault();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === " ") {
      event.preventDefault();
    }
  };
  // Keep focus on the trigger/input (also when grabbing the scrollbar).
  const onPopoverMouseDown = (event: Event) => event.preventDefault();
  const itemOf = (event: Event): HTMLElement | null =>
    (event.target as Element | null)?.closest?.(
      '[data-part="item"]',
    ) as HTMLElement | null;
  const onPointerDown = (event: Event) => {
    if (itemOf(event)) {
      event.preventDefault();
    }
  };
  const onPointerMove = (event: Event) => {
    const item = itemOf(event);
    if (item && (event as PointerEvent).pointerType !== "touch") {
      machine.highlight(item.dataset.value ?? "", "pointer");
    }
  };
  const onItemClick = (event: Event) => {
    const item = itemOf(event);
    if (item) {
      machine.selectKey(item.dataset.value ?? "");
    }
  };
  const onClear = () => {
    machine.clear();
    focusAfterClose();
  };
  popover.addEventListener("mousedown", onPopoverMouseDown);

  inputEl?.addEventListener("input", onInputEvent);
  inputEl?.addEventListener("compositionstart", onCompositionStart);
  inputEl?.addEventListener("compositionend", onCompositionEnd);
  inputEl?.addEventListener("keydown", onInputKeyDown);
  inputEl?.addEventListener("focus", onInputFocus);
  inputEl?.addEventListener("click", onInputClick);
  inputEl?.addEventListener("blur", onInputBlur);
  // A popover input only counts while the popover is open (the trigger is a select-only control before that).
  let offInput =
    inputEl && !inputInPopover ? machine.registerInput() : () => {};
  // Combobox: a press anywhere on the control (not on a button or the input) edits the text.
  const onControlClick = (event: Event) => {
    if (
      inputEl &&
      !inputInPopover &&
      (event.target as Element).closest("input, button, a") === null
    ) {
      inputEl.focus();
      machine.onInputClick();
    }
  };
  control?.addEventListener("click", onControlClick);
  trigger.addEventListener("click", onTriggerClick);
  trigger.addEventListener("keydown", onKeyDown);
  trigger.addEventListener("keyup", onKeyUp);
  popover.addEventListener("pointerdown", onPointerDown);
  popover.addEventListener("pointermove", onPointerMove);
  popover.addEventListener("click", onItemClick);
  clearEl?.addEventListener("click", onClear);
  const offClear = clearEl ? machine.registerClear() : () => {};

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => registerItems());
  observer?.observe(list, { childList: true, subtree: true });

  registerItems();
  render();
  renderLoad();
  if (options.defaultOpen) {
    machine.open("imperative", "selected");
  }

  return {
    getValue: () => machine.store.get().value as string | string[] | null,
    setValue(value) {
      machine.setValue(value as never);
      render();
    },
    open: () => machine.open("imperative"),
    close: () => machine.close("imperative"),
    refresh() {
      registerItems();
      render();
      remeasure();
    },
    setInvalid(invalid) {
      machine.sync({ invalid });
    },
    setLoadMore(next) {
      loadState = { ...loadState, ...next };
      if (next.isLoading !== undefined) {
        machine.setLoading(loadState.isLoading);
      }
      renderLoad();
      remeasure();
    },
    destroy() {
      observer?.disconnect();
      unsubscribe();
      offCollection();
      offClear();
      trigger.removeEventListener("click", onTriggerClick);
      trigger.removeEventListener("keydown", onKeyDown);
      trigger.removeEventListener("keyup", onKeyUp);
      popover.removeEventListener("pointerdown", onPointerDown);
      popover.removeEventListener("pointermove", onPointerMove);
      popover.removeEventListener("click", onItemClick);
      clearEl?.removeEventListener("click", onClear);
      popover.removeEventListener("mousedown", onPopoverMouseDown);
      control?.removeEventListener("click", onControlClick);
      inputEl?.removeEventListener("input", onInputEvent);
      inputEl?.removeEventListener("compositionstart", onCompositionStart);
      inputEl?.removeEventListener("compositionend", onCompositionEnd);
      inputEl?.removeEventListener("keydown", onInputKeyDown);
      inputEl?.removeEventListener("focus", onInputFocus);
      inputEl?.removeEventListener("click", onInputClick);
      inputEl?.removeEventListener("blur", onInputBlur);
      offInput();
      observer?.disconnect();
      sentinelObserver?.disconnect();
      offLoadMore();
      guard.destroy();
      offReset();
      hidden?.remove();
      live?.remove();
      overlay?.destroy();
      machine.destroy();
    },
  };
}
