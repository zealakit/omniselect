import assert from "node:assert/strict";
import { after, test } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "@zealakit/overlay-react";
import { createElement as h, type ReactNode } from "react";
import { Select } from "../dist/select/index.js";

after(() => cleanup());

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
const press = (target: Element, key: string) =>
  target.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    }),
  );
const click = (target: Element) => {
  for (const type of [
    "pointerdown",
    "mousedown",
    "pointerup",
    "mouseup",
    "click",
  ]) {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "button", { value: 0 });
    Object.defineProperty(event, "isPrimary", { value: true });
    target.dispatchEvent(event);
  }
};

function tree(props: Record<string, unknown> = {}, extra: ReactNode[] = []) {
  return h(
    Select.Root as never,
    props,
    h(
      Select.Control,
      null,
      h(Select.Trigger, null, h(Select.Value, { placeholder: "Pick" })),
      ...extra,
    ),
    h(
      Select.Popover,
      null,
      h(
        Select.List,
        null,
        h(Select.Item as never, { value: "a" }, "A"),
        h(Select.Item as never, { value: "b" }, "B"),
      ),
    ),
  );
}

test("inside an Overlay Dialog: Escape closes the Select first, then the Dialog", async () => {
  render(
    h(
      Dialog,
      { defaultOpen: true },
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Title"),
        tree({ portal: false }),
      ),
    ),
  );
  await flush();
  const trigger = document.querySelector("[role=combobox]") as HTMLElement;
  assert.ok(trigger, "select trigger renders inside the dialog");
  await act(async () => click(trigger));
  await flush();
  assert.ok(document.querySelector("[role=listbox]"), "select is open");

  await act(async () => press(trigger, "Escape"));
  await flush();
  assert.equal(document.querySelector("[role=listbox]"), null, "select closed");
  assert.ok(document.querySelector("[role=dialog]"), "dialog stays open");

  await act(async () => press(trigger, "Escape"));
  await flush();
  assert.equal(
    document.querySelector("[role=dialog]"),
    null,
    "dialog closed on the second Escape",
  );
});

test("inside an Overlay Dialog: pressing an item is not an outside press for the Dialog", async () => {
  render(
    h(
      Dialog,
      { defaultOpen: true },
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Title"),
        tree({ portal: false }),
      ),
    ),
  );
  await flush();
  const trigger = document.querySelector("[role=combobox]") as HTMLElement;
  await act(async () => click(trigger));
  await flush();
  const item = document.querySelector("[role=option]") as HTMLElement;
  await act(async () => click(item));
  await flush();
  assert.ok(
    document.querySelector("[role=dialog]"),
    "dialog still open after picking an item",
  );
  assert.equal(trigger.textContent?.trim(), "A");
});

test("presence: the popover stays mounted until exit animations finish", async () => {
  let finish: () => void = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const proto = window.HTMLElement.prototype as unknown as {
    getAnimations?: () => unknown[];
  };
  const original = proto.getAnimations;
  proto.getAnimations = () => [{ finished }];
  try {
    render(tree());
    const trigger = document.querySelector("[role=combobox]") as HTMLElement;
    await act(async () => click(trigger));
    await flush();
    await act(async () => click(trigger));
    await flush();
    const popover = document.querySelector("[data-part=popover]");
    assert.ok(popover, "still mounted while the animation runs");
    assert.equal(popover.getAttribute("data-state"), "closed");
    await act(async () => {
      finish();
      await finished;
    });
    await flush();
    assert.equal(
      document.querySelector("[data-part=popover]"),
      null,
      "removed after the animation",
    );
  } finally {
    proto.getAnimations = original;
  }
});

test("structure: Clear inside Trigger warns in development", async () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (message: string) => warnings.push(String(message));
  try {
    render(
      h(
        Select.Root as never,
        {},
        h(
          Select.Control,
          null,
          h(
            Select.Trigger,
            null,
            h(Select.Value, null),
            h(Select.Clear, null, "x"),
          ),
        ),
      ),
    );
    await flush();
  } finally {
    console.warn = original;
  }
  assert.ok(
    warnings.some((w) => w.includes("Select.Clear is inside Select.Trigger")),
    warnings.join("\n"),
  );
});
