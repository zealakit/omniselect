import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { walkImports } from "../../core/tests/support/import-graph.ts";

const entry = fileURLToPath(new URL("../dist/native/index.js", import.meta.url));

test("the /native entry never reaches another component or the Select modules", () => {
  const graph = walkImports(entry);
  assert.ok(graph.files.length > 0);
  for (const name of graph.packages) {
    assert.ok(
      !name.startsWith("@zealakit/") || /^@zealakit\/(ui-engine|omniselect)/.test(name),
      `unexpected component import: ${name}`,
    );
  }
  for (const file of graph.files) {
    assert.ok(!file.includes("/dist/select/"), `unexpected Select module: ${file}`);
  }
});
