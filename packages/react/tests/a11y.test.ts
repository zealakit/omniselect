import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { createElement as h } from "react";
import { Select } from "../dist/select/index.js";

afterEach(() => cleanup());

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
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
const fill = (input: HTMLInputElement, text: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  )?.set;
  setter?.call(input, text);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
};

/**
 * axe-core against happy-dom: structure, ARIA and naming rules only. Rules that
 * need layout or rendering (contrast, target size, visibility) cannot run here.
 */
async function audit(label: string): Promise<void> {
  const result = await axe.run(document.body, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
    },
    rules: {
      "color-contrast": { enabled: false },
      "target-size": { enabled: false },
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
    },
  });
  const violations = result.violations.map(
    (v) =>
      `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  assert.deepEqual(violations, [], `${label}: ${violations.join("\n")}`);
}

const items = () => [
  h(Select.Item as never, { key: "a", value: "a" }, "Apple"),
  h(Select.Item as never, { key: "b", value: "b" }, "Banana"),
  h(Select.Item as never, { key: "c", value: "c", disabled: true }, "Cherry"),
];

const select = (
  props: Record<string, unknown>,
  extra: unknown[] = [],
  empty = false,
) =>
  h(
    "main",
    null,
    h(
      Select.Root as never,
      { portal: false, ...props },
      h(Select.Label, null, "Fruit"),
      h(
        Select.Control,
        null,
        ...((props.combobox ? [h(Select.Input, null)] : []) as never[]),
        h(Select.Trigger, null, h(Select.Value, { placeholder: "Pick" })),
        h(Select.Clear, null, "×"),
      ),
      h(
        Select.Popover,
        null,
        h(
          Select.List,
          null,
          ...(items() as never[]),
          ...((empty ? [h(Select.Empty, null, "No results")] : []) as never[]),
          ...(extra as never[]),
        ),
      ),
    ),
  );

test("a11y: closed select-only", async () => {
  render(select({}));
  await flush();
  await audit("closed");
});

test("a11y: open select-only with a selected item", async () => {
  render(select({ defaultValue: "b" }));
  await flush();
  await act(async () =>
    click(document.querySelector("[role=combobox]") as Element),
  );
  await flush();
  await audit("open");
});

test("a11y: open multiple", async () => {
  render(select({ multiple: true, defaultValue: ["a"] }));
  await flush();
  await act(async () =>
    click(document.querySelector("[role=combobox]") as Element),
  );
  await flush();
  await audit("multiple");
});

test("a11y: combobox filtered, and empty", async () => {
  render(select({ combobox: true }, [], true));
  await flush();
  const input = document.querySelector("input") as HTMLInputElement;
  await act(async () => fill(input, "an"));
  await flush();
  await audit("combobox filtered");
  await act(async () => fill(input, "zzz"));
  await flush();
  await audit("combobox empty");
});

test("a11y: required and invalid", async () => {
  render(h("form", null, select({ name: "fruit", required: true })));
  await flush();
  const hidden = document.querySelector("[data-part=hidden-select]") as Element;
  await act(async () =>
    hidden.dispatchEvent(new window.Event("invalid", { cancelable: true })),
  );
  await flush();
  await audit("invalid");
});
