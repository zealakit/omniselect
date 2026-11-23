import assert from "node:assert/strict";
import { test } from "node:test";
import { NativeSelect } from "../dist/native/index.js";
import { Select } from "../dist/select/index.js";
import * as root from "../dist/index.js";

// The public surface is identical in every adapter; this guards against drift.
const SELECT_PARTS = [
  "Clear",
  "Control",
  "Empty",
  "Group",
  "GroupLabel",
  "Indicator",
  "Input",
  "Item",
  "ItemIndicator",
  "Label",
  "List",
  "LoadMore",
  "Popover",
  "Root",
  "Trigger",
  "Value",
];
const NATIVE_PARTS = ["Control", "Indicator", "Label", "Option", "OptionGroup", "Root"];

test("Select exposes exactly the documented parts", () => {
  assert.deepEqual(Object.keys(Select).sort(), SELECT_PARTS);
});

test("NativeSelect exposes exactly the documented parts", () => {
  assert.deepEqual(Object.keys(NativeSelect).sort(), NATIVE_PARTS);
});

test("the root entry re-exports both primitives and nothing else at runtime", () => {
  assert.deepEqual(Object.keys(root).sort(), ["NativeSelect", "Select"]);
  assert.equal(root.Select, Select);
  assert.equal(root.NativeSelect, NativeSelect);
});
