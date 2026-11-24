import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { walkImports } from "../../core/tests/support/import-graph.ts";

const entry = fileURLToPath(new URL("../dist/select/index.js", import.meta.url));

test("[X4] the /select entry uses the engine directly and no overlay adapter", () => {
  const graph = walkImports(entry);
  const overlays = graph.packages.filter((name) => name.startsWith("@zealakit/overlay"));
  // X4 (engine-direct popover): a Select inside an overlay Dialog used to close
  // both on one Escape because overlay carried its own Escape stack. The listbox
  // now floats on the engine's layers and /position, so overlay is not reachable.
  assert.deepEqual(overlays, []);
  assert.ok(
    graph.packages.includes("@zealakit/ui-engine"),
    "select floats on the engine's layers and /position",
  );
});
