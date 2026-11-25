import assert from "node:assert/strict";
import { test } from "node:test";
import { createIds, createSelectMachine, encodeKey, nextId } from "../dist/index.js";
import type { SelectMachine } from "../dist/index.js";

/**
 * `[OS-AD-1…5]` — the activedescendant candidate, characterized so treeview
 * (15-1, which extracts it) can diff against it before and after the move.
 *
 * The contract: the id is derived from the highlighted option's key, it is
 * present only while the list is open and something is highlighted, and it
 * always equals an id an option actually rendered.
 */

const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

function setup(): { ids: ReturnType<typeof createIds>; machine: SelectMachine<string> } {
  const rootId = nextId("os-ad");
  const ids = createIds(rootId);
  const machine = createSelectMachine<string>({ rootId, itemToKey: (item: string) => item });
  for (const item of ITEMS) {
    machine.collection.register({
      key: item.value,
      value: item.value,
      textValue: item.label,
      disabled: false,
      groupId: null,
    });
  }
  return { ids, machine };
}

test("[OS-AD-1] a key is encoded into something an id can hold", () => {
  const encoded = encodeKey("x y%z");
  assert.ok(!encoded.includes(" "), "no spaces in an id");
  assert.ok(!encoded.includes("%"), "no percent-escapes left behind");
  assert.equal(encodeKey("x y%z"), encodeKey("x y%z"), "deterministic");
  assert.notEqual(encodeKey("a b"), encodeKey("ab"), "distinct keys stay distinct");
});

test("[OS-AD-2] aria-activedescendant equals the highlighted option's id", () => {
  const { ids, machine } = setup();
  machine.open("keyboard", "first");
  machine.highlight("banana");
  const attrs = machine.attrs.input();
  assert.equal(attrs["aria-activedescendant"], ids.item("banana"));
  assert.equal(attrs["aria-activedescendant"], `${ids.root}-item-banana`);
});

test("[OS-AD-3] it is absent while closed or with nothing highlighted", () => {
  const { machine } = setup();
  assert.equal(machine.attrs.input()["aria-activedescendant"], undefined, "closed");

  machine.open("keyboard", "none");
  assert.equal(machine.attrs.input()["aria-activedescendant"], undefined, "open with no highlight");

  machine.close("imperative");
  machine.highlight("apple");
  assert.equal(machine.attrs.input()["aria-activedescendant"], undefined, "highlighted but closed");
});

test("[OS-AD-4] two machines never produce the same activedescendant id", () => {
  const a = setup();
  const b = setup();
  a.machine.open("keyboard", "first");
  b.machine.open("keyboard", "first");
  a.machine.highlight("apple");
  b.machine.highlight("apple");

  assert.notEqual(a.ids.root, b.ids.root, "distinct roots");
  assert.notEqual(
    a.machine.attrs.input()["aria-activedescendant"],
    b.machine.attrs.input()["aria-activedescendant"],
  );
});

test("[OS-AD-5] the trigger carries it too in combobox mode, and the option id matches", () => {
  const { ids, machine } = setup();
  machine.open("keyboard", "first");
  machine.highlight("cherry");

  const trigger = machine.attrs.trigger();
  const item = machine.attrs.item("cherry");
  assert.equal(trigger["aria-activedescendant"], ids.item("cherry"));
  assert.equal(item.id, ids.item("cherry"), "the option renders the id the attribute points at");
  assert.equal(item.role, "option");
});
