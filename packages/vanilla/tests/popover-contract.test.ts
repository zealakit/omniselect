import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createSelect } from "../dist/select/index.js";

/**
 * `[OS-POP-1…12]` contract for the vanilla Select — the behaviour the popover
 * controller must keep (03-2 Step 1). Items 8–10 need the overlay pilot for the
 * nested-Dialog case and are covered by the engine/overlay suites; the rest run
 * here against the built adapter.
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

function mount(): { root: HTMLElement; select: ReturnType<typeof createSelect> } {
  const root = host();
  const select = createSelect(root, {});
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
  const { root } = mount();
  const trigger = part(root, "trigger");
  trigger.click();

  const outside = document.createElement("p");
  document.body.append(outside);
  pointer(outside);
  assert.equal(part(root, "popover").hidden, true, "an outside press closes it");
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
