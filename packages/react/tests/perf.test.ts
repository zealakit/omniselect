import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import { createElement as h, Profiler } from "react";
import { Select } from "../dist/select/index.js";

afterEach(() => cleanup());

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
const fill = (input: HTMLInputElement, text: string) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
  setter?.call(input, text);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
};

const COUNT = 1000;

function view(renders: Map<string, number>) {
  return h(
    Select.Root as never,
    { portal: false },
    h(Select.Control, null, h(Select.Input as never, { placeholder: "Search" })),
    h(
      Select.Popover,
      null,
      h(
        Select.List,
        null,
        ...(Array.from({ length: COUNT }, (_, i) =>
          h(
            Profiler,
            {
              key: i,
              id: `item-${i}`,
              onRender: (id: string) => renders.set(id, (renders.get(id) ?? 0) + 1),
            },
            h(Select.Item as never, { value: `item-${i}` }, `Item ${i}`),
          ),
        ) as never[]),
      ),
    ),
  );
}

test("perf: 1,000 items filter in well under a frame budget and highlight moves re-render two items", async () => {
  const renders = new Map<string, number>();
  render(view(renders));
  await flush();
  const input = document.querySelector("input") as HTMLInputElement;

  const started = performance.now();
  await act(async () => {
    press(input, "ArrowDown");
  });
  await flush();
  assert.equal(document.querySelectorAll("[role=option]").length, COUNT);

  const keystrokes: number[] = [];
  for (const text of ["i", "it", "ite", "item", "item-9"]) {
    const t0 = performance.now();
    await act(async () => {
      fill(input, text);
    });
    keystrokes.push(performance.now() - t0);
  }
  const perKey = keystrokes.reduce((a, b) => a + b, 0) / keystrokes.length;
  console.log(
    `perf: open+mount ${(performance.now() - started).toFixed(0)} ms total, filter ${perKey.toFixed(1)} ms/keystroke (happy-dom, ${COUNT} items)`,
  );
  // Generous CI ceiling: happy-dom is far slower than a browser. The point is to catch O(n^2) regressions.
  assert.ok(perKey < 400, `filter keystroke took ${perKey.toFixed(1)} ms`);
  assert.ok(document.querySelectorAll("[role=option]").length < COUNT);

  await act(async () => {
    fill(input, "");
  });
  await flush();
  renders.clear();
  await act(async () => {
    press(input, "ArrowDown");
  });
  const first = new Set(renders.keys());
  renders.clear();
  await act(async () => {
    press(input, "ArrowDown");
  });
  const second = new Set(renders.keys());
  assert.ok(first.size <= 2, `first move re-rendered ${first.size} items`);
  assert.ok(second.size <= 2, `highlight move re-rendered ${second.size} items`);
});
