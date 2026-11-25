import { after } from "node:test";
import assert from "node:assert/strict";
import { act, cleanup, render } from "@testing-library/react";
import { createElement as h } from "react";
import { runPopoverContract, runSsrRow } from "../../core/tests/conformance/popover-dom.ts";
import { renderToString } from "react-dom/server";
import { Select } from "../dist/select/index.js";

/**
 * `[OS-POP-1…8, 11]` for the React adapter, from the shared DOM-level contract.
 * Items 9–10 (overlay Dialog) need the overlay dev dependency and stay in the
 * vanilla package until that is agreed.
 */

after(() => cleanup());

const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

function tree(): ReturnType<typeof h> {
  return h(
    Select.Root as never,
    {},
    h(Select.Label, null, "Fruit"),
    h(
      Select.Control,
      null,
      h(Select.Input, null),
      h(Select.Trigger, null, h(Select.Value, { placeholder: "Pick" })),
    ),
    h(
      Select.Popover,
      null,
      h(
        Select.List,
        null,
        h(Select.Item, { value: "apple" }, "Apple"),
        h(Select.Item, { value: "banana" }, "Banana"),
      ),
    ),
  );
}

function maybePart(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-part="${name}"]`);
}

function part(name: string): HTMLElement {
  const element = maybePart(name);
  assert.ok(element, `${name} missing`);
  return element;
}

runPopoverContract("react", async () => {
  const view = render(tree() as never);
  await flush();
  return {
    part,
    maybePart,
    triggerPress() {
      const trigger = part("trigger");
      const down = new window.Event("pointerdown", { bubbles: true, cancelable: true });
      Object.defineProperty(down, "button", { value: 0 });
      Object.defineProperty(down, "isPrimary", { value: true });
      trigger.dispatchEvent(down);
      trigger.click();
    },
    escapeField() {
      const field = maybePart("input") ?? part("trigger");
      field.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    },
    settle: flush,
    unmount() {
      view.unmount();
    },
  };
});

runSsrRow("react", () => renderToString(tree() as never));
