import assert from "node:assert/strict";
import { test } from "node:test";
import { getGlobalState } from "../dist/index.js";

test("state is created once per name and shared afterwards", () => {
  let created = 0;
  const create = () => {
    created += 1;
    return { count: 0 };
  };
  const first = getGlobalState("test-shared", create);
  const second = getGlobalState("test-shared", create);
  assert.equal(first, second);
  assert.equal(created, 1);
});

test("different names get independent state", () => {
  const a = getGlobalState("test-a", () => ({ id: "a" }));
  const b = getGlobalState("test-b", () => ({ id: "b" }));
  assert.notEqual(a, b);
});

test("state lives under a versioned Symbol.for key on globalThis", () => {
  const value = getGlobalState("test-key", () => ({ ok: true }));
  const key = Symbol.for("@zealakit/omniselect-core/v1/test-key");
  assert.equal((globalThis as unknown as Record<symbol, unknown>)[key], value);
});
