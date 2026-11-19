import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("react adapter and its Overlay dependency import without browser globals", () => {
  const script = `
    const overlay = await import("@zealakit/overlay-react");
    const omniselect = await import("./dist/index.js");
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      overlayExports: Object.keys(overlay).length,
      omniselectLoaded: typeof omniselect,
    }));
  `;

  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: packageRoot, encoding: "utf8" },
  );

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

test("NativeSelect renders the default option as selected on the server", () => {
  const script = `
    const React = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { NativeSelect } = await import("./dist/native/index.js");
    const h = React.createElement;
    const html = renderToString(
      h(NativeSelect.Root, { defaultValue: "b", name: "x" },
        h(NativeSelect.Label, null, "L"),
        h(NativeSelect.Control, null,
          h(NativeSelect.Option, { value: "a" }, "A"),
          h(NativeSelect.Option, { value: "b" }, "B"))),
    );
    console.log(JSON.stringify({ document: typeof document, html }));
  `;
  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: packageRoot, encoding: "utf8" },
  );
  const result = JSON.parse(output.trim()) as {
    document: string;
    html: string;
  };
  assert.equal(result.document, "undefined");
  assert.match(result.html, /<option value="b" selected="">B<\/option>/);
  assert.match(result.html, /<label for=/);
});
