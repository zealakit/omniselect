import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { walkImports } from "../../core/tests/support/import-graph.ts";

const entry = fileURLToPath(new URL("../dist/select/index.js", import.meta.url));

test("[X4] the /select entry uses the engine directly and no overlay adapter", () => {
  const graph = walkImports(entry);
  const overlays = graph.packages.filter((name) => name.startsWith("@zealakit/overlay"));
  assert.deepEqual(overlays, [], "X4: no overlay adapter in the runtime path");
  assert.ok(graph.packages.includes("@zealakit/ui-engine"), "floats on the engine");
});
