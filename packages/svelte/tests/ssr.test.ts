import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const loader = pathToFileURL(
  fileURLToPath(new URL("./svelte-ssr-loader.ts", import.meta.url)),
).href;

test("svelte adapter and its Overlay dependency import without browser globals", () => {
  const script = `
    const overlay = await import("@zealakit/overlay-svelte");
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
    [
      "--strip-types",
      "--import",
      loader,
      "--input-type=module",
      "--eval",
      script,
    ],
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
    const { render } = await import("svelte/server");
    const Harness = (await import("./tests/fixtures/native-harness.svelte")).default;
    const tree = [
      { part: "label", text: "L" },
      { part: "control", children: [
        { part: "option", props: { value: "a" }, text: "A" },
        { part: "option", props: { value: "b" }, text: "B" },
      ] },
    ];
    const { body } = render(Harness, { props: { tree, initial: { defaultValue: "b" }, form: false } });
    console.log(JSON.stringify({ document: typeof document, html: body }));
  `;
  const output = execFileSync(
    process.execPath,
    [
      "--strip-types",
      "--import",
      loader,
      "--input-type=module",
      "--eval",
      script,
    ],
    { cwd: packageRoot, encoding: "utf8" },
  );
  const result = JSON.parse(output.trim()) as {
    document: string;
    html: string;
  };
  assert.equal(result.document, "undefined");
  assert.match(
    result.html,
    /<option[^>]*value="b"[^>]*selected|<option[^>]*selected[^>]*value="b"/,
  );
});

test("Select renders closed, select-only markup on the server", () => {
  const script = `
    const { render } = await import("svelte/server");
    const Harness = (await import("./tests/fixtures/select-harness.svelte")).default;
    const tree = [
      { part: "label", text: "L" },
      { part: "control", children: [
        { part: "trigger", children: [{ part: "value", props: { placeholder: "Pick" } }] },
        { part: "clear", text: "x" },
      ] },
      { part: "popover", children: [{ part: "list", children: [{ part: "item", props: { value: "a" }, text: "A" }] }] },
    ];
    const { body } = render(Harness, { props: { tree, initial: { defaultValue: "b", itemToString: (v) => v.toUpperCase() } } });
    console.log(JSON.stringify({ document: typeof document, html: body }));
  `;
  const output = execFileSync(
    process.execPath,
    [
      "--strip-types",
      "--import",
      loader,
      "--input-type=module",
      "--eval",
      script,
    ],
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
