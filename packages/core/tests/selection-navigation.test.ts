import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSelection,
  createTypeahead,
  first,
  last,
  next,
  pageDown,
  pageUp,
  prev,
} from "../dist/index.js";

type Obj = { id: number };
const itemToKey = (o: Obj) => String(o.id);

test("single selection: replace, no deselect on same key, remove", () => {
  const s = createSelection<Obj>({ mode: "single", itemToKey });
  const a = { id: 1 };
  const current = s.select(s.empty(), a);
  assert.equal(current, a);
  assert.equal(s.select(current, { id: 1 }), a);
  assert.deepEqual(s.toggle(current, { id: 2 }), { id: 2 });
  assert.equal(s.remove(current, { id: 1 }), null);
  assert.equal(s.remove(current, { id: 9 }), current);
  assert.equal(s.isSelected(current, { id: 1 }), true);
  assert.deepEqual(s.keys(current), ["1"]);
  assert.equal(s.isEmpty(null), true);
});

test("multi selection keeps insertion order and toggles by key", () => {
  const s = createSelection<Obj>({ mode: "multiple", itemToKey });
  let v = s.empty();
  v = s.toggle(v, { id: 2 });
  v = s.toggle(v, { id: 1 });
  v = s.select(v, { id: 1 });
  assert.deepEqual(s.keys(v), ["2", "1"]);
  v = s.toggle(v, { id: 2 });
  assert.deepEqual(s.keys(v), ["1"]);
  assert.deepEqual(s.empty(), []);
  assert.equal(s.isEmpty(s.remove(v, { id: 1 })), true);
});

const items = [{ key: "a" }, { key: "b", disabled: true }, { key: "c" }, { key: "d" }];

test("navigation skips disabled and respects wrap", () => {
  assert.equal(first(items), "a");
  assert.equal(last(items), "d");
  assert.equal(next(items, "a"), "c");
  assert.equal(next(items, "d"), "d");
  assert.equal(next(items, "d", { wrap: true }), "a");
  assert.equal(prev(items, "c"), "a");
  assert.equal(prev(items, "a"), "a");
  assert.equal(prev(items, "a", { wrap: true }), "d");
  assert.equal(next(items, null), "a");
  assert.equal(prev(items, null), "d");
});

test("navigation handles missing keys, disabled origin, and empty lists", () => {
  assert.equal(next(items, "zzz"), "a");
  assert.equal(prev(items, "zzz"), "d");
  assert.equal(next(items, "b"), "c");
  assert.equal(next([], "a"), null);
  assert.equal(prev([], "a"), null);
  assert.equal(first([{ key: "x", disabled: true }]), null);
  assert.equal(last([]), null);
  assert.equal(pageDown([], null), null);
  assert.equal(pageUp([], null), null);
});

test("paging clamps to the ends", () => {
  assert.equal(pageDown(items, "a", 2), "d");
  assert.equal(pageDown(items, null, 1), "a");
  assert.equal(pageDown(items, "zzz", 1), "a");
  assert.equal(pageUp(items, "d", 2), "a");
  assert.equal(pageUp(items, null, 5), "a");
  assert.equal(pageUp(items, "zzz", 5), "a");
});

const fruit = [
  { key: "apple", textValue: "Apple" },
  { key: "apricot", textValue: "Apricot" },
  { key: "banana", textValue: "Banana" },
  { key: "cherry", textValue: "Cherry", disabled: true },
];

test("typeahead: prefix, growing query, cycling, timeout", () => {
  let t = 0;
  const ta = createTypeahead({ timeout: 500, now: () => t });
  assert.equal(ta.onKey("b", fruit, null), "banana");
  assert.equal(ta.hasBuffer(), true);
  t = 1000;
  assert.equal(ta.hasBuffer(), false);
  assert.equal(ta.onKey("a", fruit, null), "apple");
  t = 1100;
  assert.equal(ta.onKey("p", fruit, "apple"), "apple");
  t = 1200;
  assert.equal(ta.onKey("r", fruit, "apple"), "apricot");
  t = 3000;
  assert.equal(ta.onKey("a", fruit, "apple"), "apricot");
  t = 3100;
  assert.equal(ta.onKey("a", fruit, "apricot"), "apple");
  t = 3200;
  assert.equal(ta.onKey("a", fruit, "apple"), "apricot");
});

test("typeahead: disabled items and no match", () => {
  const ta = createTypeahead();
  assert.equal(ta.onKey("c", fruit, null), null);
  ta.reset();
  assert.equal(ta.hasBuffer(), false);
  assert.equal(ta.onKey("z", [], null), null);
});
