import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("core imports in a process without browser globals", () => {
  const script = `
    const core = await import("./dist/index.js");
    const state = core.getGlobalState("ssr", () => ({ ok: true }));
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      ok: state.ok,
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
    ok: boolean;
    exportCount: number;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.equal(result.ok, true);
  assert.ok(result.exportCount > 0);
});
