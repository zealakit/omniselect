import assert from "node:assert/strict";
import { test } from "node:test";
import * as root from "../dist/index.js";
import { createNativeSelect } from "../dist/native/index.js";
import { createSelect } from "../dist/select/index.js";

test("the root entry re-exports the two factories and nothing else at runtime", () => {
  assert.deepEqual(Object.keys(root).sort(), ["createNativeSelect", "createSelect"]);
  assert.equal(root.createSelect, createSelect);
  assert.equal(root.createNativeSelect, createNativeSelect);
});
