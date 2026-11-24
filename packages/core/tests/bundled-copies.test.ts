import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as primary from "../dist/index.js";

/**
 * Each public adapter bundles its own copy of Core. Load a second, physically
 * separate copy of the build (as two adapters on one page would) and check that
 * ids come from the engine's one page-wide counter, so two bundles never mint
 * the same id (X11). Core keeps no page-global state of its own any more.
 */
const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const copyDir = mkdtempSync(join(packageDir, ".tmp-core-copy-"));
cpSync(join(packageDir, "dist"), copyDir, { recursive: true });
const secondary = (await import(pathToFileURL(join(copyDir, "index.js")).href)) as typeof primary;

after(() => {
  rmSync(copyDir, { recursive: true, force: true });
});

test("the second copy is a separate module instance", () => {
  assert.notEqual(primary.nextId, secondary.nextId);
});

test("two bundled copies never mint the same id", () => {
  const ids = new Set<string>();
  for (let index = 0; index < 50; index += 1) {
    ids.add(primary.nextId("omniselect"));
    ids.add(secondary.nextId("omniselect"));
  }
  assert.equal(ids.size, 100, "every id is unique across both copies");
  for (const id of ids) {
    assert.match(id, /^zealakit-omniselect-\d+$/);
  }
});
