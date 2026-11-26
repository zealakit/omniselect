import { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { runPopoverContract, runSsrRow } from "../../core/tests/conformance/popover-dom.ts";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { Select } from "../dist/select/index.js";

/**
 * `[OS-POP-1…8, 11]` for the Vue adapter, from the shared DOM-level contract.
 */

after(() => {
  document.body.replaceChildren();
});
const vueWrappers: { unmount: () => void }[] = [];
afterEach(() => {
  for (const wrapper of vueWrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});

const flush = async (): Promise<void> => {
  for (let index = 0; index < 3; index += 1) {
    await nextTick();
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

const App = defineComponent({
  setup() {
    return () =>
      h(Select.Root, null, () => [
        h(Select.Label, null, () => "Fruit"),
        h(Select.Control, null, () => [
          h(Select.Input),
          h(Select.Trigger, null, () => [h(Select.Value, { placeholder: "Pick" })]),
        ]),
        h(Select.Popover, null, () => [
          h(Select.List, null, () => [
            h(Select.Item, { value: "apple" }, () => "Apple"),
            h(Select.Item, { value: "banana" }, () => "Banana"),
          ]),
        ]),
      ]);
  },
});

runPopoverContract("vue", async () => {
  const wrapper = mount(App, { attachTo: document.body });
  await flush();
  return {
    part,
    maybePart,
    escapeField() {
      const field = maybePart("input") ?? part("trigger");
      field.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    },
    settle: flush,
    triggerPress() {
      const trigger = part("trigger");
      const down = new window.Event("pointerdown", { bubbles: true, cancelable: true });
      Object.defineProperty(down, "button", { value: 0 });
      Object.defineProperty(down, "isPrimary", { value: true });
      trigger.dispatchEvent(down);
      trigger.click();
    },
    unmount() {
      wrapper.unmount();
    },
  };
});

runSsrRow("vue", () => renderToString(createSSRApp(App)));

// Q4: OS-POP-9/9b/10 against the linked Overlay pilot (dev dependency).
import { Dialog, DialogContent, DialogTrigger } from "@zealakit/overlay-vue";
import { test } from "node:test";

const clickAt = (element: Element | null) =>
  element?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const dialogOpen = () =>
  document.querySelector('[data-testid="dialog-content"]')?.getAttribute("data-state") === "open";
const selectOpen = () => {
  const popover = document.querySelector<HTMLElement>('[data-part="popover"]');
  return popover !== null && popover.hidden !== true;
};

const SelectApp = defineComponent({
  setup: () => () =>
    h(Select.Root, null, () => [
      h(Select.Label, null, () => "Fruit"),
      h(Select.Control, null, () => [
        h(Select.Input),
        h(Select.Trigger, null, () => [h(Select.Value, { placeholder: "Pick" })]),
      ]),
      h(Select.Popover, null, () => [
        h(Select.List, null, () => [h(Select.Item, { value: "apple" }, () => "Apple")]),
      ]),
    ]),
});

const mountInDialog = (content: boolean | (() => unknown) = true) => {
  const Inner = content === true ? SelectApp : (content as () => unknown);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Dialog, null, {
          default: () => [
            h(DialogTrigger, { "data-testid": "dialog-trigger" }, () => "Open dialog"),
            h(
              DialogContent,
              { "data-testid": "dialog-content" },
              { default: () => h(Inner as never) },
            ),
          ],
        }),
    }),
    { attachTo: document.body },
  );
  vueWrappers.push(wrapper);
  return wrapper;
};

test("[OS-POP-9] nested in an Overlay Dialog: Escape closes the Select, then the Dialog", async () => {
  mountInDialog();
  await flush();
  clickAt(document.querySelector('[data-testid="dialog-trigger"]'));
  await flush();
  assert.equal(dialogOpen(), true, "the Dialog opens");

  const selectTrigger = part("trigger");
  clickAt(selectTrigger);
  await flush();
  assert.equal(selectOpen(), true, "the Select is open inside the Dialog");

  selectTrigger.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
  await flush();
  assert.equal(selectOpen(), false, "the first Escape closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");

  document.activeElement?.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
  await flush();
  assert.equal(dialogOpen(), false, "the second Escape closes the Dialog");
});

test("[OS-POP-9b] a press inside the Dialog but outside the Select closes only the Select", async () => {
  const wrapper = mountInDialog();
  await flush();
  clickAt(document.querySelector('[data-testid="dialog-trigger"]'));
  await flush();
  const selectTrigger = part("trigger");
  selectTrigger.dispatchEvent(
    new window.PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }),
  );
  clickAt(selectTrigger);
  await flush();
  assert.equal(selectOpen(), true);

  document
    .querySelector('[data-testid="dialog-content"]')
    ?.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }),
    );
  await flush();
  assert.equal(selectOpen(), false, "the press closes the Select");
  assert.equal(dialogOpen(), true, "the Dialog stays open");
  wrapper.unmount();
});

// OS-POP-10 (Select in an Overlay Popover in a Dialog) is **open for Vue**: the
// Select trigger inside the overlay Popover content does not open the Select in
// this harness (measured 2026-11-26). React and vanilla cover the three-layer row.
