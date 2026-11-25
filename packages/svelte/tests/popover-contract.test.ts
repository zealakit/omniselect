import { after } from "node:test";
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
