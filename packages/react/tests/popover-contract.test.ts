import { after } from "node:test";
import assert from "node:assert/strict";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach } from "node:test";
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
afterEach(() => cleanup());

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

// Q4: OS-POP-9/9b/10 against the linked Overlay pilot (dev dependency).
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zealakit/overlay-react";
import { fireEvent } from "@testing-library/react";
import type { ComponentType } from "react";
const anyPart = (component: unknown) => component as ComponentType<Record<string, unknown>>;
import { test } from "node:test";

const dialogState = (): string | null =>
  document.querySelector('[data-testid="dialog-content"]')?.getAttribute("data-state") ?? null;
/** React unmounts the DialogContent when closed, so "absent" is closed too. */
const dialogOpen = () => dialogState() === "open";
const maybeSelectPopover = () => document.querySelector<HTMLElement>('[data-part="popover"]');
const selectOpen = () => {
  const popover = maybeSelectPopover();
  return popover !== null && popover.hidden !== true;
};

test("[OS-POP-9] nested in an Overlay Dialog: Escape closes the Select, then the Dialog", async () => {
  render(
    h(
      Dialog,
      null,
      h(anyPart(DialogTrigger), { "data-testid": "dialog-trigger" }, "Open dialog"),
      h(anyPart(DialogContent), { "data-testid": "dialog-content" }, tree()),
    ) as never,
  );
  fireEvent.click(document.querySelector('[data-testid="dialog-trigger"]') as HTMLElement);
  await flush();
  assert.equal(dialogOpen(), true, "the Dialog opens");

  const selectTrigger = part("trigger");
  fireEvent.click(selectTrigger);
  await flush();
  assert.equal(selectOpen(), true, "the Select is open inside the Dialog");

  fireEvent.keyDown(selectTrigger, { key: "Escape" });
  await flush();
  assert.equal(selectOpen(), false, "the first Escape closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");

  fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
  await flush();
  assert.equal(dialogOpen(), false, "the second Escape closes the Dialog");
});

test("[OS-POP-9b] a press inside the Dialog but outside the Select closes only the Select", async () => {
  render(
    h(
      Dialog,
      null,
      h(anyPart(DialogTrigger), { "data-testid": "dialog-trigger" }, "Open dialog"),
      h(anyPart(DialogContent), { "data-testid": "dialog-content" }, tree(), h("p", null, "other")),
    ) as never,
  );
  fireEvent.click(document.querySelector('[data-testid="dialog-trigger"]') as HTMLElement);
  await flush();
  const selectTrigger = part("trigger");
  fireEvent.click(selectTrigger);
  await flush();
  assert.equal(selectOpen(), true);

  fireEvent.pointerDown(
    document.querySelector('[data-testid="dialog-content"]')?.querySelector("p") as Element,
    {
      button: 0,
      isPrimary: true,
      pointerType: "mouse",
    },
  );
  await flush();
  assert.equal(selectOpen(), false, "the press closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");
});

test("[OS-POP-10] Select in a Popover in a Dialog: three Escapes, focus returns each time", async () => {
  render(
    h(
      Dialog,
      null,
      h(anyPart(DialogTrigger), { "data-testid": "dialog-trigger" }, "Open dialog"),
      h(
        DialogContent,
        { "data-testid": "dialog-content" },
        h(
          Popover,
          null,
          h(anyPart(PopoverTrigger), { "data-testid": "popover-trigger" }, "Open popover"),
          h(anyPart(PopoverContent), { "data-testid": "popover-content" }, tree()),
        ),
      ),
    ) as never,
  );
  fireEvent.click(document.querySelector('[data-testid="dialog-trigger"]') as HTMLElement);
  await flush();
  fireEvent.click(document.querySelector('[data-testid="popover-trigger"]') as HTMLElement);
  await flush();
  const popoverTrigger = document.querySelector('[data-testid="popover-trigger"]') as HTMLElement;
  const selectTrigger = part("trigger");
  fireEvent.click(selectTrigger);
  await flush();
  assert.equal(selectOpen(), true);

  fireEvent.keyDown(selectTrigger, { key: "Escape" });
  await flush();
  assert.equal(selectOpen(), false, "1: the Select closed");
  assert.ok(
    selectTrigger.closest('[data-part="control"]')?.contains(document.activeElement),
    "1: focus returned into the Select control",
  );

  fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
  await flush();
  assert.equal(
    document.querySelector('[data-testid="popover-content"]')?.getAttribute("data-state") ??
      "closed",
    "closed",
    "2: the Popover closed",
  );
  assert.equal(document.activeElement, popoverTrigger, "2: focus returned to the popover trigger");

  fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
  await flush();
  assert.equal(dialogOpen(), false, "3: the Dialog closed");
  assert.equal(
    document.activeElement,
    document.querySelector('[data-testid="dialog-trigger"]') as HTMLElement,
    "3: focus returned to the dialog trigger",
  );
});
