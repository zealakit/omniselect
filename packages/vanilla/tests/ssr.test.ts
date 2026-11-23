import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("vanilla adapter and its Overlay dependency import without browser globals", () => {
  const script = `
    const overlay = await import("@zealakit/overlay-vanilla");
    const omniselect = await import("./dist/index.js");
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      overlayExports: Object.keys(overlay).length,
      omniselectLoaded: typeof omniselect,
    }));
  `;

  const output = execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageRoot,
    encoding: "utf8",
  });

  const result = JSON.parse(output.trim()) as {
    window: string;
    document: string;
    overlayExports: number;
    omniselectLoaded: string;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.ok(result.overlayExports > 0);
  assert.equal(result.omniselectLoaded, "object");
});
