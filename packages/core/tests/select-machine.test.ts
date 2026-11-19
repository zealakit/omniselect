import assert from "node:assert/strict";
import { test } from "node:test";
import { createSelectMachine, type SelectMachine } from "../dist/index.js";

type Machine = SelectMachine<string>;

function make(
  items: { key: string; text?: string; disabled?: boolean }[],
  options: Partial<Parameters<typeof createSelectMachine<string>>[0]> = {},
) {
  const events: unknown[][] = [];
  const machine = createSelectMachine<string>({
    rootId: "r",
    onValueChange: (v) => events.push(["value", v]),
    onOpenChange: (o, why) => events.push(["open", o, why]),
    ...options,
  });
  for (const item of items) {
    machine.collection.register({
      key: item.key,
      value: item.key,
      textValue: item.text ?? item.key,
      disabled: item.disabled,
    });
  }
  return { machine, events };
}

const key = (m: Machine, k: string, extra: object = {}) =>
  m.onTriggerKeyDown({ key: k, ...extra });
const fruit = [
  { key: "apple" },
  { key: "banana" },
  { key: "cherry", disabled: true },
  { key: "date" },
];

test("closed: ArrowDown opens on first, ArrowUp on last enabled, selected wins", () => {
  const a = make(fruit);
  assert.equal(key(a.machine, "ArrowDown").preventDefault, true);
  assert.equal(a.machine.store.get().highlightedKey, "apple");
  const b = make(fruit);
  key(b.machine, "ArrowUp");
  assert.equal(b.machine.store.get().highlightedKey, "date");
  const c = make(fruit, { defaultValue: "banana" });
  key(c.machine, "ArrowDown");
  assert.equal(c.machine.store.get().highlightedKey, "banana");
  assert.deepEqual(a.events[0], ["open", true, "keyboard"]);
});

test("closed: Home/End/Enter/Space open; Alt+ArrowUp does nothing", () => {
  for (const [k, expected] of [
    ["Home", "apple"],
    ["End", "date"],
    ["Enter", "apple"],
    [" ", "apple"],
  ] as const) {
    const { machine } = make(fruit);
    key(machine, k);
    assert.equal(machine.store.get().open, true, k);
    assert.equal(machine.store.get().highlightedKey, expected, k);
  }
  const { machine } = make(fruit);
  assert.equal(key(machine, "ArrowUp", { altKey: true }).preventDefault, false);
  assert.equal(machine.isOpen(), false);
});

test("open: arrows skip disabled, respect loop, Home/End/Page", () => {
  const { machine } = make(fruit);
  key(machine, "ArrowDown");
  key(machine, "ArrowDown");
  assert.equal(machine.store.get().highlightedKey, "banana");
  key(machine, "ArrowDown");
  assert.equal(machine.store.get().highlightedKey, "date");
  key(machine, "ArrowDown");
  assert.equal(machine.store.get().highlightedKey, "date");
  key(machine, "Home");
  assert.equal(machine.store.get().highlightedKey, "apple");
  key(machine, "End");
  assert.equal(machine.store.get().highlightedKey, "date");
  key(machine, "PageUp");
  assert.equal(machine.store.get().highlightedKey, "apple");
  key(machine, "PageDown");
  assert.equal(machine.store.get().highlightedKey, "date");
  const looped = make(fruit, { loop: true });
  key(looped.machine, "End");
  key(looped.machine, "ArrowDown");
  assert.equal(looped.machine.store.get().highlightedKey, "apple");
});

test("open: Enter selects and closes; Space too; Alt+ArrowUp selects and closes", () => {
  const a = make(fruit);
  key(a.machine, "ArrowDown");
  key(a.machine, "ArrowDown");
  key(a.machine, "Enter");
  assert.equal(a.machine.store.get().value, "banana");
  assert.equal(a.machine.isOpen(), false);
  assert.deepEqual(a.events.at(-1), ["open", false, "select"]);
  const b = make(fruit);
  key(b.machine, "ArrowDown");
  key(b.machine, " ");
  assert.equal(b.machine.store.get().value, "apple");
  const c = make(fruit);
  key(c.machine, "ArrowDown");
  key(c.machine, "ArrowUp", { altKey: true });
  assert.equal(c.machine.store.get().value, "apple");
  assert.equal(c.machine.isOpen(), false);
});

test("open: Tab selects the highlighted item, closes, and lets focus move", () => {
  const { machine, events } = make(fruit);
  key(machine, "ArrowDown");
  const result = key(machine, "Tab");
  assert.equal(result.preventDefault, false);
  assert.equal(machine.store.get().value, "apple");
  assert.deepEqual(events.at(-1), ["open", false, "tab"]);
});

test("type-ahead: closed selects without opening, open highlights, Space joins the buffer", () => {
  let t = 0;
  const closed = make(
    [{ key: "apple" }, { key: "banana" }, { key: "blueberry" }],
    { now: () => t },
  );
  key(closed.machine, "b");
  assert.equal(closed.machine.store.get().value, "banana");
  assert.equal(closed.machine.isOpen(), false);
  const open = make(
    [
      { key: "new york", text: "New York" },
      { key: "nevada", text: "Nevada" },
    ],
    { now: () => t },
  );
  key(open.machine, "ArrowDown");
  key(open.machine, "n");
  key(open.machine, "e");
  key(open.machine, "w");
  key(open.machine, " ");
  assert.equal(open.machine.store.get().highlightedKey, "new york");
  assert.equal(open.machine.store.get().value, null);
  t = 5000;
  key(open.machine, " ");
  assert.equal(open.machine.store.get().value, "new york");
});

test("Backspace clears only while a Clear is registered", () => {
  const { machine } = make(fruit, { defaultValue: "banana" });
  assert.equal(key(machine, "Backspace").preventDefault, false);
  const off = machine.registerClear();
  assert.equal(key(machine, "Backspace").preventDefault, true);
  assert.equal(machine.store.get().value, null);
  off();
  assert.equal(machine.store.get().hasClear, false);
});

test("disabled blocks opening and keys; composing is ignored", () => {
  const { machine } = make(fruit, { disabled: true });
  assert.equal(key(machine, "ArrowDown").preventDefault, false);
  machine.open("imperative");
  assert.equal(machine.isOpen(), false);
  const other = make(fruit);
  assert.equal(
    key(other.machine, "ArrowDown", { isComposing: true }).preventDefault,
    false,
  );
});

test("allowsEmptyCollection=false blocks opening an empty list and closes when it empties", () => {
  const empty = make([], { allowsEmptyCollection: false });
  empty.machine.open("imperative");
  assert.equal(empty.machine.isOpen(), false);
  const { machine, events } = make([{ key: "a" }], {
    allowsEmptyCollection: false,
  });
  machine.open("imperative");
  machine.collection.setFilter("zzz");
  assert.equal(machine.isOpen(), false);
  assert.deepEqual(events.at(-1), ["open", false, "empty"]);
});

test("controlled open and value wait for the parent", () => {
  const { machine, events } = make(fruit, { open: false, value: null });
  machine.open("trigger");
  assert.equal(machine.isOpen(), false);
  assert.deepEqual(events[0], ["open", true, "trigger"]);
  machine.sync({ open: true });
  assert.equal(machine.isOpen(), true);
  machine.selectKey("apple");
  assert.equal(machine.store.get().value, null);
  assert.deepEqual(
    events.find((e) => e[0] === "value"),
    ["value", "apple"],
  );
  machine.sync({ value: "apple", open: false });
  assert.equal(machine.store.get().value, "apple");
  assert.equal(machine.isOpen(), false);
});

test("labels survive unmounted items; selectedLabels uses itemToString as fallback", () => {
  const { machine } = make([{ key: "a", text: "Alpha" }], {
    defaultValue: "a",
  });
  assert.deepEqual(machine.selectedLabels(), ["Alpha"]);
  const off = machine.collection.register({
    key: "b",
    value: "b",
    textValue: "Beta",
  });
  off();
  assert.equal(machine.labelOf("b"), "Beta");
  const fallback = createSelectMachine<string>({
    rootId: "x",
    itemToString: (v) => v.toUpperCase(),
    defaultValue: "zed",
  });
  assert.deepEqual(fallback.selectedLabels(), ["ZED"]);
});

test("attrs: select-only trigger, list, item, group", () => {
  const { machine } = make(fruit, { required: true });
  key(machine, "ArrowDown");
  const trigger = machine.attrs.trigger();
  assert.equal(trigger.role, "combobox");
  assert.equal(trigger["aria-expanded"], "true");
  assert.equal(trigger["aria-activedescendant"], "r-item-apple");
  assert.equal(trigger["aria-controls"], "r-listbox");
  assert.equal(trigger["aria-required"], "true");
  assert.equal(trigger["data-placeholder"], "");
  const item = machine.attrs.item("apple");
  assert.equal(item.role, "option");
  assert.equal(item["data-highlighted"], "");
  assert.equal(item["aria-selected"], "false");
  assert.equal(machine.attrs.item("cherry")["aria-disabled"], "true");
  assert.equal(machine.attrs.list().role, "listbox");
  assert.equal(
    machine.attrs.group("g", true)["aria-labelledby"],
    "r-group-g-label",
  );
  assert.equal(
    machine.attrs.clear("Clear selection")["aria-label"],
    "Clear selection",
  );
  assert.equal(machine.attrs.root()["data-state"], "open");
});

test("multiple mode toggles, keeps open, labels in order", () => {
  const { machine } = make(fruit, { multiple: true });
  machine.open("imperative");
  machine.selectKey("banana");
  machine.selectKey("apple");
  assert.deepEqual(machine.selectedLabels(), ["banana", "apple"]);
  assert.equal(machine.isOpen(), true);
  machine.selectKey("banana");
  assert.deepEqual(machine.selectedLabels(), ["apple"]);
  assert.equal(machine.attrs.list()["aria-multiselectable"], "true");
});
