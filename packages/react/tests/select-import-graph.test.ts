import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { walkImports } from "../../core/tests/support/import-graph.ts";

const entry = fileURLToPath(
  new URL("../dist/select/index.js", import.meta.url),
);

test("the /select entry reaches its Overlay adapter and never another framework's", () => {
  const graph = walkImports(entry);
  const overlays = graph.packages.filter((name) =>
    name.startsWith("@zealakit/overlay"),
  );
  assert.ok(overlays.length > 0, "select uses Overlay");
  for (const name of overlays) {
    assert.match(name, /^@zealakit\/overlay-[a-z]+$/);
    assert.notEqual(name, "@zealakit/overlay-core");
  }
});
