import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as primary from "../dist/index.js";

/**
 * Each public adapter bundles its own copy of Core. Load a second, physically
 * separate copy of the build (as two adapters on one page would) and check
 * that page-global state is still shared between the copies.
 */
const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const copyDir = mkdtempSync(join(packageDir, ".tmp-core-copy-"));
cpSync(join(packageDir, "dist"), copyDir, { recursive: true });
const secondary = (await import(pathToFileURL(join(copyDir, "index.js")).href)) as typeof primary;

after(() => {
  rmSync(copyDir, { recursive: true, force: true });
});

test("the second copy is a separate module instance", () => {
  assert.notEqual(primary.getGlobalState, secondary.getGlobalState);
});

test("copies share page-global state", () => {
  const first = primary.getGlobalState("bundled-copies", () => ({ n: 1 }));
  const second = secondary.getGlobalState("bundled-copies", () => ({ n: 2 }));
  assert.equal(first, second);
  assert.equal(second.n, 1);
});
