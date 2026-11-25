import { after } from "node:test";
import assert from "node:assert/strict";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { runPopoverContract } from "../../core/tests/conformance/popover-dom.ts";
import { Select } from "../dist/select/index.js";

/**
 * `[OS-POP-1…8, 11]` for the Vue adapter, from the shared DOM-level contract.
 */

after(() => {
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
