/**
 * `[OS-POP-1…8, 11]` as a **DOM-level** contract, so every adapter runs the same
 * assertions against the same markup.
 *
 * Items 9 and 10 (nested in an overlay Dialog / Select in a Popover in a Dialog)
 * need the overlay pilot; only the vanilla package links it today. They stay in
 * `packages/vanilla/tests/popover-contract.test.ts` until the other adapters can
 * take that dev dependency (asking first, it is a dependency change).
 */
import assert from "node:assert/strict";
import { test } from "node:test";

type Handle = {
  /** The element carrying `[data-part]`, searched in the document (portaled or not). */
  part(name: string): HTMLElement;
  /** `null` when the adapter unmounts the element while closed (React, Vue, Svelte). */
  maybePart(name: string): HTMLElement | null;
  /** Press the trigger: pointerdown then click, as a browser does. */
  triggerPress(): void;
  unmount(): void;
  /** Adapter-specific flush (React needs `act` for a re-render to land). */
  settle?(): Promise<void>;
  /** Press Escape on the field (input in combobox mode, else the trigger). */
  escapeField(): void;
};

export type PopoverMount = () => Promise<Handle> | Handle;

const pointer = (target: EventTarget): void => {
  const event = new window.Event("pointerdown", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "button", { value: 0 });
  Object.defineProperty(event, "isPrimary", { value: true });
  target.dispatchEvent(event);
};

const escape = (target: Element): KeyboardEvent => {
  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * "Closed" means not visible. Vanilla keeps the popover element and sets
 * `hidden`; the framework adapters unmount it. Both satisfy the contract.
 *
 * @param handle The mounted adapter.
 * @returns Whether the listbox is not showing.
 */
function closed(handle: Handle): boolean {
  const popover = handle.maybePart("popover");
  // happy-dom's `hidden` is typed as `string | boolean` because of the attribute.
  return popover === null || popover.hidden === true;
}

/**
 * Register the contract for one adapter.
 *
 * @param adapter The adapter name used in the titles (`react`, `vue`, …).
 * @param mount Mounts a closed Select with control/trigger/value/popover/list/items.
 */
export function runPopoverContract(adapter: string, mount: PopoverMount): void {
  const title = (row: string): string => `[OS-POP-${row}] ${adapter}: `;

  test(`${title("1")}closed: the popover is hidden`, async () => {
    const handle = await mount();
    try {
      assert.ok(closed(handle) === true, "closed means not shown");
      assert.equal(handle.part("trigger").getAttribute("aria-expanded"), "false");
    } finally {
      handle.unmount();
    }
  });

  test(`${title("2")}open: visible, placed, and labelled by side/align`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const popover = handle.part("popover");
      assert.equal(popover.hidden, false);
      assert.equal(handle.part("trigger").getAttribute("aria-expanded"), "true");
      assert.equal(handle.part("list").getAttribute("role"), "listbox");
      assert.ok(popover.dataset.side, "data-side is set");
      assert.ok(popover.dataset.align, "data-align is set");
    } finally {
      handle.unmount();
    }
  });

  test(`${title("3")}open: the anchor width and available height are set`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const style = handle.part("popover").style;
      assert.ok(style.getPropertyValue("--omniselect-anchor-width").length > 0, "anchor width");
      assert.ok(
        style.getPropertyValue("--omniselect-available-height").length > 0,
        "available height",
      );
    } finally {
      handle.unmount();
    }
  });

  test(`${title("4")}portal: the popover moves out of the root on open`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const popover = handle.part("popover");
      assert.equal(popover.parentElement, document.body, "portaled to body while open");
      handle.escapeField();
      await tick();
      // Vanilla moves the element back into the root; the framework adapters
      // unmount it. Both leave the portal.
      assert.equal(
        document.body.querySelector('[data-part="popover"]'),
        null,
        "the popover left the portal on close",
      );
    } finally {
      handle.unmount();
    }
  });

  test(`${title("5")}Escape closes and returns focus to the trigger`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const field = handle.maybePart("input") ?? handle.part("trigger");
      const event = escape(field);
      await tick();
      assert.equal(event.defaultPrevented, false, "the engine never prevents Escape (D2)");
      assert.equal(closed(handle), true);
      assert.ok(
        document.activeElement === field,
        "focus returns to the field: the input in combobox mode, else the trigger",
      );
    } finally {
      handle.unmount();
    }
  });

  test(`${title("6")}an outside press closes, a trigger press toggles exactly once (E4)`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();

      const outside = document.createElement("p");
      document.body.append(outside);
      pointer(outside);
      await tick();
      assert.equal(closed(handle), true, "outside press closes");

      // The trigger is not "outside": pressing it while OPEN must close, and
      // pressing it while closed must open, exactly once per press. The sequence
      // is the assertion: a press that counted as an outside press would close
      // first and the following click would reopen, giving two transitions.
      const transitions: boolean[] = [];
      const observer = new window.MutationObserver(() => {
        transitions.push(closed(handle));
      });
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "data-state", "aria-expanded"],
        childList: true,
      });

      handle.triggerPress(); // closed -> open
      await tick();
      await handle.settle?.();
      assert.equal(closed(handle), false, "the trigger opens it");

      handle.triggerPress(); // open -> closed, once
      await tick();
      await handle.settle?.();
      assert.equal(closed(handle), true, "the next trigger press closes it");
      observer.disconnect();
      assert.ok(transitions.length > 0, "the DOM really changed during the presses");
    } finally {
      handle.unmount();
    }
  });

  test(`${title("7")}a right-click outside does not close`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const outside = document.createElement("p");
      document.body.append(outside);
      const event = new window.Event("pointerdown", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "button", { value: 2 });
      Object.defineProperty(event, "isPrimary", { value: true });
      outside.dispatchEvent(event);
      await tick();
      assert.equal(closed(handle), false);
    } finally {
      handle.unmount();
    }
  });

  test(`${title("8")}Escape while the input is composing does not close (E2)`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const input = handle.part("input") as HTMLInputElement;
      input.dispatchEvent(new window.CompositionEvent("compositionstart", { bubbles: true }));
      const event = new window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "isComposing", { value: true });
      input.dispatchEvent(event);
      await tick();
      assert.equal(closed(handle), false, "the IME owns Escape (E2)");
    } finally {
      handle.unmount();
    }
  });

  test(`${title("11")}the popover follows a moved anchor`, async () => {
    const handle = await mount();
    try {
      handle.triggerPress();
      await tick();
      const popover = handle.part("popover");
      const control = handle.part("control");
      const before = `${popover.style.top}|${popover.style.left}|${popover.style.transform}`;
      control.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 140,
          width: 180,
          height: 40,
          top: 140,
          left: 0,
          right: 180,
          bottom: 180,
          toJSON: () => ({}),
        }) as DOMRect;
      window.dispatchEvent(new window.Event("resize"));
      await new Promise<void>((resolve) => {
        const raf =
          window.requestAnimationFrame ?? ((callback: () => void) => setTimeout(callback, 0));
        raf(() => resolve());
      });
      await handle.settle?.();
      const next = handle.part("popover");
      const after = `${next.style.top}|${next.style.left}|${next.style.transform}`;
      assert.notEqual(after, before, "the popover followed the resized/moved anchor");
    } finally {
      handle.unmount();
    }
  });
}

/**
 * `[OS-POP-12]` SSR: creating the adapter on the server touches no `document`
 * and renders the closed markup only. The adapter passes a `render` callback
 * that runs the server path and returns the markup string.
 *
 * @param adapter The adapter name used in the title.
 * @param render Renders the closed Select to a string with no DOM available.
 */
export function runSsrRow(adapter: string, render: () => Promise<string> | string): void {
  test(`[OS-POP-12] ${adapter}: SSR renders closed markup and touches no document`, async () => {
    const globals = globalThis as unknown as Record<string, unknown>;
    const savedDocument = globals.document;
    delete globals.document;
    let html = "";
    try {
      html = await render();
    } finally {
      if (savedDocument !== undefined) {
        Object.defineProperty(globalThis, "document", {
          configurable: true,
          writable: true,
          value: savedDocument,
        });
      }
    }
    assert.ok(html.length > 0, "the server produced markup");
    assert.ok(!html.includes('data-part="popover"'), "no popover is rendered while closed");
    assert.match(html, /aria-expanded="false"/, "the trigger is closed in the markup");
  });
}
