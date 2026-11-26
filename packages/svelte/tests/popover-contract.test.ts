import { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { flushSync, mount, unmount } from "svelte";
import { runPopoverContract, runSsrRow } from "../../core/tests/conformance/popover-dom.ts";
import Fixture from "./fixtures/popover-contract.svelte";

/**
 * `[OS-POP-1…8, 11]` for the Svelte adapter, from the shared DOM-level contract.
 */

after(() => {
  document.body.replaceChildren();
});
afterEach(() => {
  document.body.replaceChildren();
});

const settle = async (): Promise<void> => {
  for (let index = 0; index < 3; index += 1) {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

function maybePart(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-part="${name}"]`);
}

function part(name: string): HTMLElement {
  const element = maybePart(name);
  assert.ok(element, `${name} missing`);
  return element;
}

runPopoverContract("svelte", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const instance = mount(Fixture, { target });
  await settle();
  return {
    part,
    maybePart,
    settle,
    escapeField() {
      const field = maybePart("input") ?? part("trigger");
      field.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    },
    triggerPress() {
      const trigger = part("trigger");
      const down = new window.Event("pointerdown", { bubbles: true, cancelable: true });
      Object.defineProperty(down, "button", { value: 0 });
      Object.defineProperty(down, "isPrimary", { value: true });
      trigger.dispatchEvent(down);
      trigger.click();
    },
    unmount() {
      void unmount(instance);
      target.remove();
    },
  };
});

// Row 12 (SSR) for Svelte lives in `tests/ssr.test.ts` — "Select renders closed,
// select-only markup on the server" — because this file's loader compiles
// fixtures with `generate: "client"` and `svelte/server` needs a server compile.
// That test asserts the same three things: no `document`, `aria-expanded="false"`,
// and no listbox in the markup.
void runSsrRow;

// Q4: OS-POP-9/9b/10 against the linked Overlay pilot (dev dependency).
import { test } from "node:test";
import DialogFixture from "./fixtures/os-pop-dialog.svelte";

const dialogOpen = () =>
  document.querySelector('[data-testid="dialog-content"]')?.getAttribute("data-state") === "open";
const selectOpen = () => {
  const popover = document.querySelector<HTMLElement>('[data-part="popover"]');
  return popover !== null && popover.hidden !== true;
};
const mountDialog = async () => {
  const target = document.createElement("div");
  document.body.append(target);
  const instance = mount(DialogFixture, { target });
  await settle();
  return { instance, target };
};

test("[OS-POP-9] nested in an Overlay Dialog: Escape closes the Select, then the Dialog", async () => {
  const { instance, target } = await mountDialog();
  document.querySelector<HTMLElement>('[data-testid="dialog-trigger"]')?.click();
  await settle();
  assert.equal(dialogOpen(), true, "the Dialog opens");

  const selectTrigger = part("trigger");
  selectTrigger.click();
  await settle();
  assert.equal(selectOpen(), true, "the Select is open inside the Dialog");

  selectTrigger.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
  await settle();
  assert.equal(selectOpen(), false, "the first Escape closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");

  document.activeElement?.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
  await settle();
  assert.equal(dialogOpen(), false, "the second Escape closes the Dialog");
  void unmount(instance);
  target.remove();
});

test("[OS-POP-9b] a press inside the Dialog but outside the Select closes only the Select", async () => {
  const { instance, target } = await mountDialog();
  document.querySelector<HTMLElement>('[data-testid="dialog-trigger"]')?.click();
  await settle();
  part("trigger").click();
  await settle();
  assert.equal(selectOpen(), true);

  document
    .querySelector('[data-testid="dialog-content"]')
    ?.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }),
    );
  await settle();
  assert.equal(selectOpen(), false, "the press closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");
  void unmount(instance);
  target.remove();
});

// OS-POP-10 (Select in an Overlay Popover in a Dialog) is **open for Svelte**:
// clicking the Select trigger inside the overlay Popover content does not open
// the Select popover (measured 2026-11-26; no popover element is rendered).
// React and Vue cover the three-layer row.
