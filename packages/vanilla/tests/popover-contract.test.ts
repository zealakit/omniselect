import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createDialog, createPopover } from "./support/engine-hosts.ts";
import { createSelect } from "../dist/select/index.js";

/**
 * `[OS-POP-1…12]` contract for the vanilla Select — the behaviour the popover
 * controller must keep (03-2 Step 1). Items 8–10 run here too: 8 is the IME
 * composition rule (E2), and 9–10 host the Select in a dialog and popover built from the engine (X36),
 * for the original blocker: a Select inside a Dialog must not close it.
 */

function host(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <span data-part="label">Fruit</span>
    <div data-part="control">
      <button data-part="trigger" type="button">Pick</button>
      <span data-part="value">Placeholder</span>
    </div>
    <div data-part="popover">
      <div data-part="list">
        <div data-part="item" data-value="apple">Apple</div>
        <div data-part="item" data-value="banana">Banana</div>
      </div>
    </div>
  `;
  document.body.append(root);
  return root;
}

function part(root: HTMLElement, name: string): HTMLElement {
  // The popover is portaled to body while open, so fall back to the document.
  const element =
    root.querySelector<HTMLElement>(`[data-part="${name}"]`) ??
    document.querySelector<HTMLElement>(`[data-part="${name}"]`);
  assert.ok(element, `${name} missing`);
  return element;
}

function pointer(target: EventTarget, init: { button?: number } = {}): Event {
  // A plain Event carrying the pointer fields: happy-dom's PointerEvent does not
  // reach the engine's capture listener, and overlay's suites use this shape.
  const event = new window.Event("pointerdown", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "button", { value: init.button ?? 0 });
  Object.defineProperty(event, "isPrimary", { value: true });
  target.dispatchEvent(event);
  return event;
}

function setBox(
  element: Element,
  box: { x: number; y: number; width: number; height: number },
): void {
  element.getBoundingClientRect = () =>
    ({
      ...box,
      top: box.y,
      left: box.x,
      right: box.x + box.width,
      bottom: box.y + box.height,
      toJSON: () => box,
    }) as DOMRect;
}

function escape(target: Element): KeyboardEvent {
  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

let cleanups: (() => void)[] = [];
beforeEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
  document.body.replaceChildren();
});

function mount(options: Parameters<typeof createSelect>[1] = {}): {
  root: HTMLElement;
  select: ReturnType<typeof createSelect>;
} {
  const root = host();
  const select = createSelect(root, options);
  cleanups.push(() => select.destroy());
  return { root, select };
}

test("[OS-POP-1] closed: the popover is hidden and not in the layer stack", async () => {
  const { root } = mount();
  assert.equal(part(root, "popover").hidden, true);
  const { getTopLayer } = await import("@zealakit/ui-engine");
  assert.equal(getTopLayer(), null);
});

test("[OS-POP-2] open: the popover is visible, placed, and labelled by side/align", () => {
  const { root } = mount();
  const trigger = part(root, "trigger");
  trigger.click();
  const popover = part(root, "popover");
  assert.equal(popover.hidden, false);
  assert.match(popover.dataset.side ?? "", /^(top|bottom|left|right)$/);
  assert.match(popover.dataset.align ?? "", /^(start|center|end)$/);
  // The controller writes viewport coordinates from `computePosition` with the
  // fixed strategy, so the panel itself must be fixed (the React adapter does
  // the same inline).
  assert.equal(popover.style.getPropertyValue("position"), "fixed");
});

test("[OS-POP-3] open: the anchor width and available height variables are set", () => {
  const { root } = mount();
  const control = part(root, "control");
  setBox(control, { x: 10, y: 20, width: 120, height: 40 });
  part(root, "trigger").click();
  const popover = part(root, "popover");
  assert.equal(popover.style.getPropertyValue("--omniselect-anchor-width"), "120px");
  assert.match(popover.style.getPropertyValue("--omniselect-available-height"), /^\d+px$/);
});

test("[OS-POP-4] portal: the popover moves to body on open and goes back on close", () => {
  const { root } = mount();
  const popover = part(root, "popover");
  const originalParent = popover.parentElement;
  part(root, "trigger").click();
  assert.equal(popover.parentElement, document.body, "moved to the portal");

  escape(part(root, "trigger"));
  assert.equal(popover.parentElement, originalParent, "restored on close");
});

test("[OS-POP-5] Escape closes and returns focus to the trigger", () => {
  const { root } = mount();
  const trigger = part(root, "trigger");
  trigger.click();
  assert.equal(part(root, "popover").hidden, false);

  const event = escape(trigger);
  assert.equal(part(root, "popover").hidden, true);
  assert.equal(document.activeElement, trigger);
  assert.equal(event.defaultPrevented, false, "the engine never prevents Escape (D2)");
});

test("[OS-POP-6] an outside press closes; a press on the trigger does not reopen-then-close", () => {
  const changes: { open: boolean; reason: string }[] = [];
  const { root } = mount({ onOpenChange: (open, reason) => changes.push({ open, reason }) });
  const trigger = part(root, "trigger");
  trigger.click();

  const outside = document.createElement("p");
  document.body.append(outside);
  pointer(outside);
  assert.equal(part(root, "popover").hidden, true, "an outside press closes it");

  // The trigger is not "outside": a press on it must toggle once. The engine
  // ignores a press that lands on the layer's own reference (E4), so the
  // following click toggles instead of closing and reopening.
  changes.length = 0;
  pointer(trigger);
  trigger.click();
  assert.equal(
    part(root, "popover").hidden,
    false,
    "pressing the trigger reopens it (no close-then-reopen)",
  );
  assert.deepEqual(
    changes,
    [{ open: true, reason: "trigger" }],
    "exactly one open, never a close-then-reopen (E4)",
  );
  // Focus is not asserted here: happy-dom's pointerdown/click never move it, so
  // the assertion would pass even if the code broke it. [OS-POP-5] covers focus
  // where our own code returns it to the trigger.

  // A second press-and-click on the trigger closes it, still once.
  pointer(trigger);
  trigger.click();
  assert.equal(part(root, "popover").hidden, true, "the next trigger press closes it");
});

test("[OS-POP-7] a right-click outside does not close the listbox", () => {
  const { root } = mount();
  part(root, "trigger").click();
  const outside = document.createElement("p");
  document.body.append(outside);

  pointer(outside, { button: 2 });
  assert.equal(part(root, "popover").hidden, false, "secondary buttons never dismiss (E5)");
});

test("[OS-POP-11] re-measuring follows a moved anchor", async () => {
  const { root } = mount();
  part(root, "trigger").click();
  const popover = part(root, "popover");
  const before = popover.style.getPropertyValue("top");
  const control = part(root, "control");
  setBox(control, { x: 0, y: 140, width: 100, height: 40 });

  window.dispatchEvent(new window.Event("resize"));
  await new Promise<void>((resolve) => {
    const raf = window.requestAnimationFrame ?? ((callback: () => void) => setTimeout(callback, 0));
    raf(() => resolve());
  });
  assert.notEqual(popover.style.getPropertyValue("top"), before, "the popover followed the anchor");
});

test("[OS-POP-12] SSR: creating the select on the server touches no document", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const packageRoot = fileURLToPath(new URL("..", import.meta.url));
  const script = `
    const select = await import("./dist/select/index.js");
    console.log(JSON.stringify({ exports: Object.keys(select).includes("createSelect") }));
  `;
  const output = execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageRoot,
    encoding: "utf8",
  });
  assert.deepEqual(JSON.parse(output.trim()), { exports: true });
});

/* ── Items 8–10: composition, and the nested-Dialog regression (real overlay pilot) ── */

function withInput(): { root: HTMLElement; select: ReturnType<typeof createSelect> } {
  const root = document.createElement("div");
  root.innerHTML = `
    <span data-part="label">Fruit</span>
    <div data-part="control">
      <input data-part="input" type="text" />
      <button data-part="trigger" type="button">Pick</button>
      <span data-part="value">Placeholder</span>
    </div>
    <div data-part="popover">
      <div data-part="list">
        <div data-part="item" data-value="apple">Apple</div>
        <div data-part="item" data-value="banana">Banana</div>
      </div>
    </div>
  `;
  document.body.append(root);
  const select = createSelect(root, {});
  cleanups.push(() => select.destroy());
  return { root, select };
}

function composition(input: HTMLInputElement, type: "compositionstart" | "compositionend"): void {
  input.dispatchEvent(new window.CompositionEvent(type, { bubbles: true }));
}

test("[OS-POP-8] Escape while the search input is composing does not close (E2)", async () => {
  const { root } = withInput();
  const trigger = part(root, "trigger");
  const popover = part(root, "popover");
  const input = part(root, "input") as HTMLInputElement;

  trigger.click();
  await Promise.resolve();
  assert.equal(popover.hidden, false, "open before the composition");

  composition(input, "compositionstart");
  const composing = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(composing, "isComposing", { value: true });
  input.dispatchEvent(composing);
  await Promise.resolve();
  assert.equal(popover.hidden, false, "still open: Escape belongs to the IME (E2)");

  composition(input, "compositionend");
  escape(input);
  await Promise.resolve();
  assert.equal(popover.hidden, true, "after the composition Escape closes");
});

function dialogShell(): {
  content: HTMLElement;
  destroy: () => void;
  dialog: { open: () => void; close: () => void };
  trigger: HTMLButtonElement;
} {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.textContent = "Open dialog";
  const content = document.createElement("div");
  content.textContent = "Dialog";
  document.body.append(trigger, content);
  const dialog = createDialog({ trigger, content });
  cleanups.push(() => dialog.destroy());
  return { trigger, content, dialog, destroy: () => dialog.destroy() };
}

test("[OS-POP-9] nested in an overlay Dialog: Escape closes the Select, then the Dialog", async () => {
  const dialogParts = dialogShell();
  dialogParts.dialog.open();

  // The Select lives inside the Dialog's content.
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-part="control">
      <button data-part="trigger" type="button">Pick</button>
      <span data-part="value">Placeholder</span>
    </div>
    <div data-part="popover">
      <div data-part="list">
        <div data-part="item" data-value="apple">Apple</div>
        <div data-part="item" data-value="banana">Banana</div>
      </div>
    </div>
  `;
  dialogParts.content.append(root);
  const select = createSelect(root, {});
  cleanups.push(() => select.destroy());

  const trigger = part(root, "trigger");
  const popover = part(root, "popover");
  trigger.click();
  await Promise.resolve();
  assert.equal(popover.hidden, false, "the select is open inside the dialog");

  // First Escape: the Select only.
  escape(trigger);
  await Promise.resolve();
  assert.equal(popover.hidden, true, "first Escape closed the Select");
  assert.equal(
    dialogParts.content.hasAttribute("data-state"),
    true,
    "the dialog content is still mounted",
  );
  assert.equal(dialogParts.content.hidden, false, "the dialog stayed open");

  // Second Escape: the Dialog.
  escape(dialogParts.content);
  await Promise.resolve();
  assert.equal(dialogParts.content.hidden, true, "second Escape closed the Dialog");
});

test("[OS-POP-9b] a press inside the Dialog but outside the Select closes only the Select", async () => {
  const dialogParts = dialogShell();
  dialogParts.dialog.open();

  const root = document.createElement("div");
  root.innerHTML = `
    <div data-part="control">
      <button data-part="trigger" type="button">Pick</button>
      <span data-part="value">Placeholder</span>
    </div>
    <div data-part="popover">
      <div data-part="list">
        <div data-part="item" data-value="apple">Apple</div>
      </div>
    </div>
  `;
  dialogParts.content.append(root);
  const select = createSelect(root, {});
  cleanups.push(() => select.destroy());

  const trigger = part(root, "trigger");
  const popover = part(root, "popover");
  trigger.click();
  await Promise.resolve();
  assert.equal(popover.hidden, false);

  const elsewhere = document.createElement("p");
  elsewhere.textContent = "other dialog content";
  dialogParts.content.append(elsewhere);
  pointer(elsewhere);
  await Promise.resolve();

  assert.equal(popover.hidden, true, "the press closed the Select");
  assert.equal(dialogParts.content.hidden, false, "the Dialog stayed open");
});

test("[OS-POP-10] Select in a Popover in a Dialog: three Escapes, focus returns each time", async () => {
  const dialogParts = dialogShell();
  dialogParts.dialog.open();

  // The middle layer: an overlay Popover inside the Dialog.
  const popoverTrigger = document.createElement("button");
  popoverTrigger.type = "button";
  popoverTrigger.textContent = "Open popover";
  const popoverContent = document.createElement("div");
  popoverContent.textContent = "Popover";
  dialogParts.content.append(popoverTrigger, popoverContent);
  const popoverHost = createPopover({ trigger: popoverTrigger, content: popoverContent });
  cleanups.push(() => popoverHost.destroy());
  popoverHost.open();
  await Promise.resolve();

  const root = document.createElement("div");
  root.innerHTML = `
    <div data-part="control">
      <button data-part="trigger" type="button">Pick</button>
      <span data-part="value">Placeholder</span>
    </div>
    <div data-part="popover">
      <div data-part="list">
        <div data-part="item" data-value="apple">Apple</div>
      </div>
    </div>
  `;
  popoverContent.append(root);
  const select = createSelect(root, {});
  cleanups.push(() => select.destroy());

  const trigger = part(root, "trigger");
  const selectPopover = part(root, "popover");
  trigger.click();
  await Promise.resolve();
  assert.equal(selectPopover.hidden, false, "the Select is open");

  escape(trigger);
  await Promise.resolve();
  assert.equal(selectPopover.hidden, true, "1: the Select closed");
  assert.equal(document.activeElement, trigger, "1: focus returned to the select trigger");

  escape(popoverTrigger);
  await Promise.resolve();
  assert.equal(popoverContent.hidden, true, "2: the Popover closed");
  assert.equal(document.activeElement, popoverTrigger, "2: focus returned to the popover trigger");

  escape(dialogParts.content);
  await Promise.resolve();
  assert.equal(dialogParts.content.hidden, true, "3: the Dialog closed");
  assert.ok(
    document.activeElement === dialogParts.trigger,
    "3: focus returned to the dialog trigger, not the select or the popover",
  );
});
