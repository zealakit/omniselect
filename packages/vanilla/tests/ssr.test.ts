import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("vanilla adapter and the engine it floats on import without browser globals", () => {
  const script = `
    const engine = await import("@zealakit/ui-engine");
    const omniselect = await import("./dist/index.js");
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      engineExports: Object.keys(engine).length,
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
    engineExports: number;
    omniselectLoaded: string;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.ok(result.engineExports > 0);
  assert.equal(result.omniselectLoaded, "object");
});
