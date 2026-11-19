import assert from "node:assert/strict";
import { test } from "node:test";
import { createControllable, createStore } from "../dist/index.js";

test("store notifies once per set and skips no-ops", () => {
  const store = createStore({ a: 1, b: 2 });
  const seen: number[] = [];
  store.subscribe((s) => seen.push(s.a));
  store.set({ a: 2 });
  store.set({ a: 2 });
  assert.deepEqual(seen, [2]);
  assert.equal(store.get().b, 2);
});

test("batch groups notifications", () => {
  const store = createStore({ a: 1, b: 1 });
  let calls = 0;
  store.subscribe(() => {
    calls += 1;
  });
  store.batch(() => {
    store.set({ a: 2 });
    store.set((s) => ({ b: s.a + 1 }));
  });
  assert.equal(calls, 1);
  assert.deepEqual(store.get(), { a: 2, b: 3 });
});

test("unsubscribe during notify and re-entrant set", () => {
  const store = createStore({ n: 0 });
  const calls: string[] = [];
  const off = store.subscribe(() => {
    calls.push("first");
    off();
  });
  store.subscribe((s) => {
    calls.push(`second:${s.n}`);
    if (s.n === 1) {
      store.set({ n: 2 });
    }
  });
  store.set({ n: 1 });
  store.set({ n: 3 });
  assert.deepEqual(calls, ["first", "second:1", "second:2", "second:3"]);
});

test("uncontrolled: set updates and reports changes", () => {
  const changes: string[] = [];
  const c = createControllable({
    defaultValue: "a",
    onChange: (v) => changes.push(v),
  });
  c.set("b");
  c.set("b");
  assert.equal(c.get(), "b");
  assert.deepEqual(changes, ["b"]);
  assert.equal(c.isControlled(), false);
});

test("controlled: set only calls onChange until sync", () => {
  const changes: string[] = [];
  const c = createControllable({
    value: "a",
    defaultValue: "x",
    onChange: (v) => changes.push(v),
  });
  c.set("b");
  assert.equal(c.get(), "a");
  assert.deepEqual(changes, ["b"]);
  c.sync("b");
  assert.equal(c.get(), "b");
  assert.equal(c.isControlled(), true);
});

test("mode switch warns and keeps the initial mode", () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (m: string) => warnings.push(m);
  try {
    const u = createControllable({ defaultValue: 1 });
    u.sync(5);
    const c = createControllable({ value: 1, defaultValue: 0 });
    c.sync(undefined);
    assert.equal(u.get(), 1);
    assert.equal(c.get(), 1);
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 2);
});

test("controlled onChange can be replaced through sync", () => {
  const log: string[] = [];
  const c = createControllable({ value: "a", defaultValue: "a" });
  c.sync("a", (v) => log.push(v));
  c.set("z");
  assert.deepEqual(log, ["z"]);
});
