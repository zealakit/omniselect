import {
  type Attrs,
  createSelectMachine,
  getPopoverVars,
  nextId,
  type SelectCloseReason,
  type SelectOpenReason,
} from "@zealakit/omniselect-core";
import {
  createOverlay,
  type DismissReason,
  type Overlay,
  type Placement,
} from "@zealakit/overlay-vanilla";

export type SelectOptions = {
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
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
  /** Accessible name of the Clear button. Default "Clear selection". */
  clearLabel?: string;
};

export type SelectHandle = {
  getValue: () => string | null;
  /** Select by key. Does not call `onValueChange`. */
  setValue: (value: string | null) => void;
  open: () => void;
  close: () => void;
  /** Re-read items and groups after you changed the markup. */
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
  const clearEl = part("clear");
  const indicator = part("indicator");
  const label = part("label");
  const empty = part("empty");
  const placeholder = valueEl?.textContent ?? "";
  const anchor = control ?? trigger;
  const portal = options.portal === undefined ? document.body : options.portal;

  const machine = createSelectMachine<string>({
    rootId: nextId("omniselect"),
    defaultValue: options.defaultValue ?? null,
    onValueChange: (value) => options.onValueChange?.(value as string | null),
    defaultOpen: options.defaultOpen,
    disabled: options.disabled,
    required: options.required,
    closeOnSelect: options.closeOnSelect,
    allowsEmptyCollection: options.allowsEmptyCollection,
    loop: options.loop,
    onOpenChange(open, reason) {
      options.onOpenChange?.(open, reason);
      if (
        !open &&
        (reason === "select" || reason === "escape" || reason === "tab")
      ) {
        trigger.focus();
      }
    },
  });
  if (label) {
    label.id = machine.ids.label;
  }

  let overlay: Overlay | null = null;
  const unregister: (() => void)[] = [];

  const registerItems = () => {
    for (const off of unregister.splice(0)) {
      off();
    }
    for (const group of Array.from(
      root.querySelectorAll<HTMLElement>('[data-part="group"]'),
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
          textValue: el.dataset.textValue ?? el.textContent?.trim() ?? "",
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

  const render = () => {
    const state = machine.store.get();
    const open = state.open;
    applyAttrs(trigger, machine.attrs.trigger());
    if (trigger instanceof HTMLButtonElement) {
      trigger.disabled = trigger.getAttribute("aria-disabled") === "true";
    }
    applyAttrs(control, machine.attrs.root());
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
      empty.hidden = machine.collection.visible().length !== 0;
      empty.setAttribute("role", "presentation");
    }
    for (const el of itemElements()) {
      const key = el.dataset.value ?? "";
      // Items register one by one; leave the rest untouched until their turn.
      if (!machine.collection.get(key)) {
        continue;
      }
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
      root.querySelectorAll<HTMLElement>('[data-part="group"]'),
    )) {
      const id = group.dataset.groupId ?? "";
      const groupLabel = group.querySelector<HTMLElement>(
        '[data-part="group-label"]',
      );
      applyAttrs(group, machine.attrs.group(id, groupLabel !== null));
      applyAttrs(groupLabel, machine.attrs.groupLabel(id));
    }
    const highlighted = state.highlightedKey;
    if (open && highlighted !== null && state.highlightSource === "keyboard") {
      const el = itemElements().find(
        (item) => item.dataset.value === highlighted,
      );
      el?.scrollIntoView?.({ block: "nearest" });
    }
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

  const unsubscribe = machine.store.subscribe(render);
  const offCollection = machine.collection.subscribe(render);

  const onTriggerClick = () => machine.toggle();
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
    trigger.focus();
  };

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
  if (options.defaultOpen) {
    machine.open("imperative", "selected");
  }

  return {
    getValue: () => machine.store.get().value as string | null,
    setValue(value) {
      machine.setValue(value as never);
      render();
    },
    open: () => machine.open("imperative"),
    close: () => machine.close("imperative"),
    refresh() {
      registerItems();
      render();
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
      overlay?.destroy();
      machine.destroy();
    },
  };
}
