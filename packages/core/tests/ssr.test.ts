import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("core imports in a process without browser globals", () => {
  const script = `
    const core = await import("./dist/index.js");
    // The engine counter is client-only; calling it on the server must not throw
    // or touch a DOM global.
    const id = core.nextId("omniselect");
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      id,
      exportCount: Object.keys(core).length,
    }));
  `;

  const output = execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageRoot,
    encoding: "utf8",
  });

  const result = JSON.parse(output.trim()) as {
    window: string;
    document: string;
    id: string;
    exportCount: number;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.match(result.id, /^zealakit-omniselect-\d+$/);
  assert.ok(result.exportCount > 0);
});
