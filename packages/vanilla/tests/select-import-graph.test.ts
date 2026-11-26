import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { walkImports } from "../../core/tests/support/import-graph.ts";

const entry = fileURLToPath(new URL("../dist/select/index.js", import.meta.url));

test("[X4] the /select entry uses the engine directly and no other component", () => {
  const graph = walkImports(entry);
  const others = graph.packages.filter(
    (name) => name.startsWith("@zealakit/") && !/^@zealakit\/(ui-engine|omniselect)/.test(name),
  );
  // X4 (engine-direct popover): the listbox floats on the engine's layers and /position,
  // which every component on the page shares, so one Escape closes one layer.
  assert.deepEqual(others, [], "X4/X36: no other component in the runtime path");
  assert.ok(
    graph.packages.includes("@zealakit/ui-engine"),
    "select floats on the engine's layers and /position",
  );
});
