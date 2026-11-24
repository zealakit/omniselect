import assert from "node:assert/strict";
import { test } from "node:test";
import { createCollection, createIds, defaultFilter, nextId, normalize } from "../dist/index.js";

const make = (compare?: Parameters<typeof createCollection<string>>[0]) =>
  createCollection<string>(compare);

test("items follow the comparator, not registration order", () => {
  const c = make({
    compare: (a, b) => (a.node as number) - (b.node as number),
  });
  c.register({ key: "b", value: "b", textValue: "B", node: 2 });
  c.register({ key: "a", value: "a", textValue: "A", node: 1 });
  assert.deepEqual(
    c.items().map((i) => i.key),
    ["a", "b"],
  );
});

test("unregister removes the item but keeps its label", () => {
  const c = make();
  const off = c.register({ key: "a", value: "a", textValue: "Apple" });
  off();
  assert.equal(c.items().length, 0);
  assert.equal(c.labelOf("a"), "Apple");
  assert.equal(
    c.labelOf("zzz", () => "fallback"),
    "fallback",
  );
  assert.equal(c.labelOf("zzz"), "zzz");
});

test("an old unregister does not remove a re-registered key", () => {
  const c = make();
  const first = c.register({ key: "a", value: "1", textValue: "A" });
  c.register({ key: "a", value: "2", textValue: "A" });
  first();
  assert.equal(c.get("a")?.value, "2");
});

test("group disabled cascades to items", () => {
  const c = make();
  c.registerGroup("g", { disabled: true });
  c.register({ key: "a", value: "a", textValue: "A", groupId: "g" });
  c.register({ key: "b", value: "b", textValue: "B" });
  assert.deepEqual(
    c.items().map((i) => i.disabled),
    [true, false],
  );
});

test("update patches an item and the label cache", () => {
  const c = make();
  c.register({ key: "a", value: "a", textValue: "A" });
  c.update("a", { textValue: "Alpha", disabled: true });
  c.update("missing", { disabled: true });
  assert.equal(c.get("a")?.disabled, true);
  assert.equal(c.labelOf("a"), "Alpha");
});

test("filtering: default, custom, manual, memoized", () => {
  const c = make();
  c.register({ key: "v", value: "v", textValue: "Việt Nam" });
  c.register({ key: "u", value: "u", textValue: "Uruguay" });
  c.setFilter("viet");
  assert.deepEqual(
    c.visible().map((i) => i.key),
    ["v"],
  );
  assert.equal(c.visible(), c.visible());
  c.setFilter("zz", false);
  assert.equal(c.visible().length, 2);
  c.setFilter("u", (item, q) => item.textValue.toLowerCase().startsWith(q));
  assert.deepEqual(
    c.visible().map((i) => i.key),
    ["u"],
  );
  c.setFilter("", undefined);
  assert.equal(c.visible().length, 2);
});

test("subscribe fires on change and version increases", () => {
  const c = make();
  let calls = 0;
  const off = c.subscribe(() => {
    calls += 1;
  });
  const before = c.version();
  c.register({ key: "a", value: "a", textValue: "A" });
  off();
  c.register({ key: "b", value: "b", textValue: "B" });
  assert.equal(calls, 1);
  assert.ok(c.version() > before);
});

test("normalize and defaultFilter handle CJK and diacritics", () => {
  assert.equal(normalize("  Việt "), "viet");
  assert.equal(defaultFilter({ value: 1, textValue: "中文选项" }, "文"), true);
  assert.equal(defaultFilter({ value: 1, textValue: "abc" }, "  "), true);
  assert.equal(defaultFilter({ value: 1, textValue: "abc" }, "d"), false);
});

test("ids encode keys safely and the id counter comes from the engine", () => {
  const ids = createIds("r");
  assert.equal(ids.item("a b/c%"), "r-item-a_20b_2Fc_25");
  assert.equal(ids.trigger, "r-trigger");
  assert.equal(ids.groupLabel("g"), "r-group-g-label");
  const a = nextId();
  const b = nextId();
  assert.notEqual(a, b);
  assert.match(a, /^zealakit-omniselect-\d+$/);
});

test("getItemText ignores aria-hidden decoration", async () => {
  const { getItemText } = await import("../dist/index.js");
  const el = document.createElement("div");
  el.innerHTML = 'Apple  <span aria-hidden="true">✓</span> pie';
  assert.equal(getItemText(el), "Apple pie");
  assert.equal(getItemText(null), "");
});
