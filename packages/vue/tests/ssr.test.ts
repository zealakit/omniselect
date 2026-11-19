import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("vue adapter and its Overlay dependency import without browser globals", () => {
  const script = `
    const overlay = await import("@zealakit/overlay-vue");
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
    const { createSSRApp, h } = await import("vue");
    const { renderToString } = await import("vue/server-renderer");
    const { NativeSelect } = await import("./dist/native/index.js");
    const App = {
      render: () =>
        h(NativeSelect.Root, { defaultValue: "b", name: "x" }, {
          default: () => [
            h(NativeSelect.Label, null, { default: () => "L" }),
            h(NativeSelect.Control, null, {
              default: () => [
                h(NativeSelect.Option, { value: "a" }, { default: () => "A" }),
                h(NativeSelect.Option, { value: "b" }, { default: () => "B" }),
              ],
            }),
          ],
        }),
    };
    const html = await renderToString(createSSRApp(App));
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
  assert.match(result.html, /<option value="b" selected[^>]*>B<\/option>/);
  assert.match(result.html, /<label for=/);
});

test("Select renders closed, select-only markup on the server", () => {
  const script = `
    const { createSSRApp, h } = await import("vue");
    const { renderToString } = await import("vue/server-renderer");
    const { Select } = await import("./dist/select/index.js");
    const App = {
      render: () =>
        h(Select.Root, { defaultValue: "b", itemToString: (v) => v.toUpperCase() }, {
          default: () => [
            h(Select.Label, null, { default: () => "L" }),
            h(Select.Control, null, {
              default: () => [
                h(Select.Trigger, null, { default: () => h(Select.Value, { placeholder: "Pick" }) }),
                h(Select.Clear, null, { default: () => "x" }),
              ],
            }),
            h(Select.Popover, null, {
              default: () => h(Select.List, null, { default: () => h(Select.Item, { value: "a" }, { default: () => "A" }) }),
            }),
          ],
        }),
    };
    const html = await renderToString(createSSRApp(App));
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
  assert.match(result.html, /role="combobox"/);
  assert.match(result.html, /aria-expanded="false"/);
  assert.match(result.html, />B</);
  assert.doesNotMatch(result.html, /role="listbox"/);
});
