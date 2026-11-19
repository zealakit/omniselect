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

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function combo(
  items: { key: string; text?: string; disabled?: boolean }[],
  options: Partial<Parameters<typeof createSelectMachine<string>>[0]> = {},
) {
  const inputs: [string, string][] = [];
  const made = make(items, {
    onInputChange: (text, why) => inputs.push([text, why]),
    ...options,
  });
  made.machine.registerInput();
  return { ...made, inputs };
}

const fruits = [
  { key: "apple", text: "Apple" },
  { key: "banana", text: "Banana" },
  { key: "cherry", text: "Cherry" },
];
const input = (m: Machine, k: string, extra: object = {}) =>
  m.onInputKeyDown({ key: k, ...extra });

test("combobox: registering an input switches attrs and disables trigger keys", () => {
  const { machine } = combo(fruits);
  assert.equal(machine.store.get().mode, "combobox");
  const trigger = machine.attrs.trigger();
  assert.equal(trigger.role, undefined);
  assert.equal(trigger.tabindex, "-1");
  assert.equal(trigger["aria-label"], "Show options");
  const field = machine.attrs.input();
  assert.equal(field.role, "combobox");
  assert.equal(field["aria-autocomplete"], "list");
  assert.equal(field.autocomplete, "off");
  assert.equal(key(machine, "ArrowDown").preventDefault, false);
});

test("combobox: unregistering returns to select-only", () => {
  const { machine } = make(fruits);
  const off = machine.registerInput();
  off();
  assert.equal(machine.store.get().mode, "select-only");
  assert.equal(machine.attrs.trigger().role, "combobox");
});

test("typing opens, filters, and highlights the first visible item", async () => {
  const { machine, events, inputs } = combo(fruits);
  machine.onInput("an");
  assert.equal(machine.isOpen(), true);
  assert.deepEqual(machine.visibleKeys(), ["banana"]);
  await settle();
  assert.equal(machine.store.get().highlightedKey, "banana");
  assert.deepEqual(events[0], ["open", true, "keyboard"]);
  assert.deepEqual(inputs[0], ["an", "input"]);
  machine.onInput("");
  assert.deepEqual(machine.visibleKeys(), ["apple", "banana", "cherry"]);
});

test("openOnInput=false keeps the list closed while typing", () => {
  const { machine } = combo(fruits, { openOnInput: false });
  machine.onInput("a");
  assert.equal(machine.isOpen(), false);
});

test("filter is diacritic-insensitive and can be custom or manual", () => {
  const a = combo([
    { key: "v", text: "Việt Nam" },
    { key: "u", text: "Uruguay" },
  ]);
  a.machine.onInput("viet");
  assert.deepEqual(a.machine.visibleKeys(), ["v"]);
  const custom = combo(fruits, {
    filter: (item, q) => item.textValue.startsWith(q),
  });
  custom.machine.onInput("Ch");
  assert.deepEqual(custom.machine.visibleKeys(), ["cherry"]);
  const manual = combo(fruits, { filter: false });
  manual.machine.onInput("zzz");
  assert.equal(manual.machine.visibleKeys().length, 3);
});

test("when closed, every item is visible regardless of the query", () => {
  const { machine } = combo(fruits);
  machine.onInput("an");
  machine.close("escape");
  assert.equal(machine.visibleKeys().length, 3);
});

test("Enter selects the highlighted item and replaces the input with its label", async () => {
  const { machine, events, inputs } = combo(fruits);
  machine.onInput("ch");
  await settle();
  assert.equal(input(machine, "Enter").preventDefault, true);
  assert.equal(machine.store.get().value, "cherry");
  assert.equal(machine.store.get().inputValue, "Cherry");
  assert.deepEqual(inputs.at(-1), ["Cherry", "select"]);
  assert.deepEqual(events.at(-1), ["open", false, "select"]);
});

test("Enter without a highlight is left to the form", () => {
  const { machine } = combo(fruits);
  assert.equal(input(machine, "Enter").preventDefault, false);
  machine.onInput("zzz");
  assert.equal(input(machine, "Enter").preventDefault, false);
});

test("ArrowDown/ArrowUp open; Alt+ArrowDown opens without a highlight", () => {
  const a = combo(fruits);
  input(a.machine, "ArrowDown");
  assert.equal(a.machine.store.get().highlightedKey, "apple");
  const b = combo(fruits);
  input(b.machine, "ArrowUp");
  assert.equal(b.machine.store.get().highlightedKey, "cherry");
  const c = combo(fruits);
  input(c.machine, "ArrowDown", { altKey: true });
  assert.equal(c.machine.isOpen(), true);
  assert.equal(c.machine.store.get().highlightedKey, null);
});

test("Escape closed clears the input; open closes and restores the label", () => {
  const { machine, inputs } = combo(fruits, { defaultValue: "banana" });
  assert.equal(machine.store.get().inputValue, "Banana");
  assert.equal(input(machine, "Escape").preventDefault, true);
  assert.equal(machine.store.get().inputValue, "");
  assert.deepEqual(inputs.at(-1), ["", "clear"]);
  machine.onInput("x");
  machine.close("escape");
  assert.equal(machine.store.get().inputValue, "Banana");
  assert.deepEqual(inputs.at(-1), ["Banana", "close"]);
});

test("blur closes and restores; restoreOnBlur=false leaves the text", () => {
  const a = combo(fruits, { defaultValue: "apple" });
  a.machine.onInput("xx");
  a.machine.onInputBlur();
  assert.equal(a.machine.isOpen(), false);
  assert.equal(a.machine.store.get().inputValue, "Apple");
  const b = combo(fruits, { restoreOnBlur: false });
  b.machine.onInput("xx");
  b.machine.onInputBlur();
  assert.equal(b.machine.store.get().inputValue, "xx");
});

test("selectionBehavior keep-input and clear-input", async () => {
  const keep = combo(fruits, { selectionBehavior: "keep-input" });
  keep.machine.onInput("ap");
  await settle();
  input(keep.machine, "Enter");
  assert.equal(keep.machine.store.get().inputValue, "ap");
  const clear = combo(fruits, { selectionBehavior: "clear-input" });
  clear.machine.onInput("ap");
  await settle();
  input(clear.machine, "Enter");
  assert.equal(clear.machine.store.get().inputValue, "");
});

test("Tab closes; it selects only with autoSelectOnTab", async () => {
  const a = combo(fruits);
  a.machine.onInput("ap");
  await settle();
  input(a.machine, "Tab");
  assert.equal(a.machine.store.get().value, null);
  assert.equal(a.machine.isOpen(), false);
  const b = combo(fruits, { autoSelectOnTab: true });
  b.machine.onInput("ap");
  await settle();
  input(b.machine, "Tab");
  assert.equal(b.machine.store.get().value, "apple");
});

test("openOnFocus and click open; focus is harmless when disabled", () => {
  const a = combo(fruits, { openOnFocus: true });
  a.machine.onInputFocus();
  assert.equal(a.machine.isOpen(), true);
  const b = combo(fruits);
  b.machine.onInputFocus();
  assert.equal(b.machine.isOpen(), false);
  b.machine.onInputClick();
  assert.equal(b.machine.isOpen(), true);
  const c = combo(fruits, { disabled: true });
  c.machine.onInput("a");
  assert.equal(c.machine.isOpen(), false);
});

test("composition defers filtering until it ends", async () => {
  const { machine } = combo(fruits);
  machine.onInput("a", { composing: true });
  assert.equal(machine.isOpen(), false);
  assert.equal(machine.store.get().inputValue, "a");
  machine.onInput("an");
  await settle();
  assert.deepEqual(machine.visibleKeys(), ["banana"]);
  assert.equal(
    input(machine, "ArrowDown", { isComposing: true }).preventDefault,
    false,
  );
});

test("clear in combobox mode clears value and input", () => {
  const { machine, inputs } = combo(fruits, { defaultValue: "apple" });
  machine.clear();
  assert.equal(machine.store.get().value, null);
  assert.equal(machine.store.get().inputValue, "");
  assert.deepEqual(inputs.at(-1), ["", "clear"]);
});

test("controlled inputValue waits for the parent", () => {
  const { machine, inputs } = combo(fruits, { inputValue: "" });
  machine.onInput("a");
  assert.equal(machine.store.get().inputValue, "");
  assert.deepEqual(inputs[0], ["a", "input"]);
  machine.sync({ inputValue: "a" });
  assert.equal(machine.store.get().inputValue, "a");
});

test("multiple + combobox: clear-input after a pick, Backspace removes the last value", () => {
  const { machine } = combo(fruits, { multiple: true });
  machine.open("imperative");
  machine.onInput("ap");
  machine.selectKey("apple");
  machine.selectKey("banana");
  assert.equal(machine.store.get().inputValue, "");
  assert.equal(machine.isOpen(), true);
  input(machine, "Backspace");
  assert.deepEqual(machine.selectedLabels(), ["Apple"]);
  machine.onInput("x");
  input(machine, "Backspace");
  assert.deepEqual(machine.selectedLabels(), ["Apple"]);
});

test("a fallback input label is replaced once the item registers", () => {
  const machine = createSelectMachine<string>({
    rootId: "r",
    defaultValue: "apple",
  });
  machine.registerInput();
  assert.equal(machine.store.get().inputValue, "apple");
  machine.collection.register({
    key: "apple",
    value: "apple",
    textValue: "Apple",
  });
  assert.equal(machine.store.get().inputValue, "Apple");
});

test("groupHasVisible follows the filter", () => {
  const { machine } = combo([]);
  machine.collection.registerGroup("g");
  machine.collection.register({
    key: "a",
    value: "a",
    textValue: "Alpha",
    groupId: "g",
  });
  machine.collection.register({ key: "b", value: "b", textValue: "Beta" });
  machine.onInput("be");
  assert.equal(machine.collection.groupHasVisible("g"), false);
  assert.equal(machine.collection.isVisible("b"), true);
});

test("multiple: announcements, removeKey, and maxSelected", () => {
  const { machine } = make(fruit, { multiple: true, maxSelected: 2 });
  machine.open("imperative");
  machine.selectKey("apple");
  assert.equal(machine.store.get().announcement, "apple added, 1 selected");
  machine.selectKey("banana");
  assert.equal(machine.maxReached(), true);
  machine.selectKey("date");
  assert.deepEqual(machine.selectedKeys(), ["apple", "banana"]);
  assert.equal(machine.attrs.item("date")["aria-disabled"], "true");
  assert.equal(machine.attrs.item("apple")["aria-disabled"], undefined);
  machine.highlight("apple");
  key(machine, "ArrowDown");
  assert.equal(machine.store.get().highlightedKey, "banana");
  machine.removeKey("apple");
  assert.equal(machine.store.get().announcement, "apple removed, 1 selected");
  assert.equal(machine.maxReached(), false);
  machine.removeKey("zzz");
  assert.deepEqual(machine.selectedKeys(), ["banana"]);
});

test("announce=false and custom messages", () => {
  const quiet = make(fruit, { multiple: true, announce: false });
  quiet.machine.selectKey("apple");
  assert.equal(quiet.machine.store.get().announcement, "");
  const custom = make(fruit, {
    multiple: true,
    messages: { added: (label, count) => `+${label}:${count}` },
  });
  custom.machine.selectKey("apple");
  assert.equal(custom.machine.store.get().announcement, "+apple:1");
  custom.machine.sync({ messages: { removed: (label) => `-${label}` } });
  custom.machine.removeKey("apple");
  assert.equal(custom.machine.store.get().announcement, "-apple");
});

test("reset restores the default value and input; invalid clears on change", () => {
  const { machine, events } = make(fruit, { defaultValue: "banana" });
  machine.selectKey("apple");
  machine.setInvalid(true);
  assert.equal(machine.attrs.trigger()["data-invalid"], "");
  assert.equal(machine.attrs.trigger()["aria-invalid"], "true");
  machine.reset();
  assert.equal(machine.store.get().value, "banana");
  assert.equal(machine.store.get().invalid, false);
  assert.deepEqual(events.at(-1), ["value", "banana"]);
  const c = combo(fruits, {
    defaultValue: "apple",
    defaultInputValue: "Apple",
  });
  c.machine.onInput("zzz");
  c.machine.reset();
  assert.equal(c.machine.store.get().inputValue, "Apple");
  assert.deepEqual(c.inputs.at(-1), ["Apple", "reset"]);
});

test("setFromKeys maps autofill keys to values and ignores unknown keys", () => {
  const multi = make(fruit, { multiple: true });
  multi.machine.setFromKeys(["banana", "nope", "apple"]);
  assert.deepEqual(multi.machine.selectedKeys(), ["banana", "apple"]);
  const single = make(fruit);
  single.machine.setFromKeys(["date"]);
  assert.equal(single.machine.store.get().value, "date");
  single.machine.setFromKeys(["nope"]);
  assert.equal(single.machine.store.get().value, "date");
});

test("multiple keyboard: Shift+Arrow extends, Ctrl+A selects all, Enter toggles and stays open", () => {
  const { machine } = make(fruit, { multiple: true });
  key(machine, "ArrowDown");
  assert.equal(machine.store.get().highlightedKey, "apple");
  key(machine, "ArrowDown", { shiftKey: true });
  assert.deepEqual(machine.selectedKeys(), ["banana"]);
  key(machine, "ArrowDown", { shiftKey: true });
  assert.deepEqual(machine.selectedKeys(), ["banana", "date"]);
  key(machine, "Enter");
  assert.deepEqual(machine.selectedKeys(), ["banana"]);
  assert.equal(machine.isOpen(), true);
  key(machine, "a", { ctrlKey: true });
  assert.deepEqual(machine.selectedKeys(), ["banana", "apple", "date"]);
  assert.deepEqual(
    machine.selectedItems().map((i) => i.label),
    ["banana", "apple", "date"],
  );
  const capped = make(fruit, { multiple: true, maxSelected: 2 });
  capped.machine.open("imperative");
  capped.machine.selectAll();
  assert.deepEqual(capped.machine.selectedKeys(), []);
});
