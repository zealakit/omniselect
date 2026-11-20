import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { act, cleanup, render } from "@testing-library/react";
import { readFormData } from "../../core/tests/conformance/index.ts";
import { Dialog, DialogContent, DialogTitle } from "@zealakit/overlay-react";
import { createElement as h, type ReactNode } from "react";
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

function comboTree(withInput: boolean) {
  return h(
    Select.Root as never,
    { defaultValue: "a", itemToString: (v: string) => v.toUpperCase() },
    h(
      Select.Control,
      null,
      withInput ? h(Select.Input, { "aria-label": "Search" }) : null,
      h(Select.Trigger, null, h(Select.Value, { placeholder: "Pick" })),
    ),
  );
}

test("mode switch: mounting and unmounting an Input flips the ARIA pattern at runtime", async () => {
  const view = render(comboTree(false));
  await flush();
  assert.equal(
    document.querySelector("[data-part=trigger]")?.getAttribute("role"),
    "combobox",
  );
  view.rerender(comboTree(true));
  await flush();
  assert.equal(
    document.querySelector("[data-part=trigger]")?.getAttribute("role"),
    null,
  );
  assert.equal(
    document.querySelector("[data-part=trigger]")?.getAttribute("tabindex"),
    "-1",
  );
  assert.equal(
    document.querySelector("input")?.getAttribute("role"),
    "combobox",
  );
  view.rerender(comboTree(false));
  await flush();
  assert.equal(
    document.querySelector("[data-part=trigger]")?.getAttribute("role"),
    "combobox",
  );
});

test("hydration: server markup is select-only; the client switches to combobox without mismatch warnings", async () => {
  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(comboTree(true));
  assert.equal(
    container.querySelector("[data-part=trigger]")?.getAttribute("role"),
    "combobox",
    "server renders select-only",
  );
  const errors: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) =>
    errors.push(args.map(String).join(" "));
  try {
    await act(async () => {
      hydrateRoot(container, comboTree(true));
    });
    await flush();
  } finally {
    console.error = original;
  }
  assert.deepEqual(errors, []);
  assert.equal(
    container.querySelector("[data-part=trigger]")?.getAttribute("role"),
    null,
  );
  assert.equal(
    (container.querySelector("input") as HTMLInputElement).value,
    "A",
  );
  container.remove();
});

test("parity: NativeSelect and Select submit identical FormData for the same config", async () => {
  const { NativeSelect } = await import("../dist/native/index.js");
  const options = ["apple", "banana", "cherry"];
  const entries = async (multiple: boolean, value: string | string[]) => {
    const native = render(
      h(
        "form",
        { "data-testid": "native" },
        h(
          NativeSelect.Root as never,
          { name: "fruit", multiple, defaultValue: value },
          h(
            NativeSelect.Control,
            null,
            ...options.map((o) =>
              h(NativeSelect.Option as never, { key: o, value: o }, o),
            ),
          ),
        ),
      ),
    );
    await flush();
    const read = (form: Element) =>
      readFormData(form.parentElement as ParentNode);
    const nativeEntries = read(
      native.container.querySelector("form") as Element,
    );
    native.unmount();
    const custom = render(
      h(
        "form",
        null,
        h(
          Select.Root as never,
          { name: "fruit", multiple, defaultValue: value },
          h(
            Select.Control,
            null,
            h(Select.Trigger, null, h(Select.Value, null)),
          ),
        ),
      ),
    );
    await flush();
    const selectEntries = read(
      custom.container.querySelector("form") as Element,
    );
    custom.unmount();
    return [nativeEntries, selectEntries] as const;
  };
  const [nativeSingle, selectSingle] = await entries(false, "banana");
  assert.deepEqual(selectSingle, nativeSingle);
  const [nativeMulti, selectMulti] = await entries(true, ["apple", "cherry"]);
  assert.deepEqual(selectMulti, nativeMulti);
});

test("Value render function exposes items, remove, and clear for chips", async () => {
  render(
    h(
      Select.Root as never,
      {
        multiple: true,
        defaultValue: ["a", "b"],
        itemToString: (v: string) => v.toUpperCase(),
      },
      h(
        Select.Control,
        null,
        h(
          Select.Trigger,
          null,
          h(Select.Value as never, null, ((info: {
            items: { key: string; label: string }[];
            remove: (value: string) => void;
          }) =>
            info.items.map((item) =>
              h(
                "span",
                {
                  key: item.key,
                  "data-chip": item.key,
                  onClick: () => info.remove(item.key),
                },
                item.label,
              ),
            )) as never),
        ),
      ),
    ),
  );
  await flush();
  const chips = () =>
    Array.from(document.querySelectorAll("[data-chip]")).map(
      (el) => el.textContent,
    );
  assert.deepEqual(chips(), ["A", "B"]);
  await act(async () =>
    (document.querySelector("[data-chip=a]") as HTMLElement).dispatchEvent(
      new window.MouseEvent("click", { bubbles: true }),
    ),
  );
  await flush();
  assert.deepEqual(chips(), ["B"]);
});

test("LoadMore: highlight and scroll stay put when a page is appended", async () => {
  const { installIntersectionObserver } = await import(
    "../../core/tests/conformance/index.ts"
  );
  installIntersectionObserver();
  const calls: string[] = [];
  const view = (count: number) =>
    h(
      Select.Root as never,
      {},
      h(Select.Control, null, h(Select.Trigger, null, "t")),
      h(
        Select.Popover,
        null,
        h(
          Select.List,
          null,
          ...Array.from({ length: count }, (_, i) =>
            h(Select.Item as never, { key: i, value: `i${i}` }, `Item ${i}`),
          ),
          h(Select.LoadMore, {
            isLoading: false,
            hasMore: true,
            onLoadMore: () => calls.push("load"),
          }),
        ),
      ),
    );
  const scrolls: string[] = [];
  const proto = window.HTMLElement.prototype as unknown as {
    scrollIntoView?: () => void;
  };
  const original = proto.scrollIntoView;
  proto.scrollIntoView = () => scrolls.push("scroll");
  try {
    const rendered = render(view(3));
    const trigger = document.querySelector("[role=combobox]") as HTMLElement;
    await act(async () => click(trigger));
    await flush();
    const item = document.querySelector(
      '[role=option][id$="-item-i1"]',
    ) as HTMLElement;
    await act(async () =>
      item.dispatchEvent(new window.Event("pointermove", { bubbles: true })),
    );
    await flush();
    assert.equal(item.getAttribute("data-highlighted"), "");
    const before = scrolls.length;
    rendered.rerender(view(6));
    await flush();
    assert.equal(document.querySelectorAll("[role=option]").length, 6);
    assert.equal(
      (
        document.querySelector('[role=option][id$="-item-i1"]') as HTMLElement
      ).getAttribute("data-highlighted"),
      "",
      "the same item stays highlighted",
    );
    assert.equal(scrolls.length, before, "appending items does not scroll");
  } finally {
    proto.scrollIntoView = original;
  }
});

test("opening never scrolls the page: no scrollIntoView, and every focus() passes preventScroll", async () => {
  const proto = window.HTMLElement.prototype as unknown as {
    scrollIntoView?: () => void;
    focus: (options?: FocusOptions) => void;
  };
  const originalScroll = proto.scrollIntoView;
  const originalFocus = proto.focus;
  const scrolled: string[] = [];
  const focusOptions: (FocusOptions | undefined)[] = [];
  proto.scrollIntoView = () => scrolled.push("scrollIntoView");
  proto.focus = function (options?: FocusOptions) {
    focusOptions.push(options);
    return originalFocus.call(this, options);
  };
  try {
    render(
      h(
        "div",
        null,
        h(
          Select.Root as never,
          { portal: false, defaultValue: "b", itemToString: (v: string) => v },
          h(
            Select.Control,
            null,
            h(Select.Trigger, null, h(Select.Value, null)),
          ),
          h(
            Select.Popover,
            null,
            h(Select.List, null, h(Select.Item as never, { value: "b" }, "B")),
          ),
        ),
        h(
          Select.Root as never,
          { portal: false },
          h(Select.Control, null, h(Select.Trigger, null, "t")),
          h(
            Select.Popover,
            null,
            h(Select.Input as never, null),
            h(Select.List, null, h(Select.Item as never, { value: "x" }, "X")),
          ),
        ),
      ),
    );
    await flush();
    const triggers = Array.from(
      document.querySelectorAll("[data-part=trigger]"),
    );
    for (const trigger of triggers) {
      await act(async () => click(trigger));
      await flush();
      await act(async () => press(trigger, "ArrowDown"));
      await act(async () => press(trigger, "Escape"));
      await flush();
    }
  } finally {
    proto.scrollIntoView = originalScroll;
    proto.focus = originalFocus;
  }
  assert.deepEqual(scrolled, []);
  assert.ok(focusOptions.length > 0, "the library focused something");
  assert.ok(
    focusOptions.every((o) => o?.preventScroll === true),
    "all library focus() calls pass preventScroll",
  );
});
