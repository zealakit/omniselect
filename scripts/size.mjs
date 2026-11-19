#!/usr/bin/env node
// Bundle-size budgets (gzip, minified) for every adapter entry. Framework runtimes and
// @zealakit/overlay-* are external; the private core is bundled, as it is in a release tarball.
// Also checks that `/native` carries no Overlay code.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Svelte is a dependency of the Svelte package, not of the repository root.
const requireFromSvelte = createRequire(
  join(root, "packages", "svelte", "package.json"),
);
const svelteCompiler = await import(
  pathToFileURL(requireFromSvelte.resolve("svelte/compiler")).href
);
const compile = svelteCompiler.compile ?? svelteCompiler.default.compile;
// Measured at 1.0.0: native 0.8-3.7 kB, select 9.0-12.6 kB. The budgets leave ~10% headroom;
// raise them only on purpose.
const BUDGETS = { native: 4 * 1024, select: 14 * 1024 };
const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "vue",
  "svelte",
  "svelte/*",
  "@zealakit/overlay-*",
];

const sveltePlugin = {
  name: "svelte",
  setup(b) {
    b.onLoad({ filter: /\.svelte$/ }, (args) => {
      const { js } = compile(readFileSync(args.path, "utf8"), {
        generate: "client",
        filename: args.path,
        css: "injected",
      });
      return {
        contents: js.code,
        loader: "js",
        resolveDir: dirname(args.path),
      };
    });
  },
};

const adapters = ["vanilla", "react", "vue", "svelte"];
const rows = [];
let failed = false;

for (const adapter of adapters) {
  for (const entry of ["native", "select"]) {
    const file = join(root, "packages", adapter, "dist", entry, "index.js");
    const result = await build({
      entryPoints: [file],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      external,
      plugins: [sveltePlugin],
      logLevel: "silent",
      conditions: ["browser", "import"],
    });
    const code = result.outputFiles[0].text;
    const gzip = gzipSync(code).length;
    const budget = BUDGETS[entry];
    const overlayLeak = entry === "native" && /overlay/i.test(code);
    const over = gzip > budget;
    failed ||= over || overlayLeak;
    rows.push({
      adapter,
      entry,
      gzip,
      budget,
      status: overlayLeak ? "OVERLAY LEAK" : over ? "OVER" : "ok",
    });
  }
}

console.log("adapter  entry   gzip      budget    status");
for (const r of rows) {
  console.log(
    `${r.adapter.padEnd(8)} ${r.entry.padEnd(7)} ${(`${(r.gzip / 1024).toFixed(2)} kB`).padEnd(9)} ${(`${(r.budget / 1024).toFixed(0)} kB`).padEnd(9)} ${r.status}`,
  );
}
if (failed) {
  console.error(
    "\nBundle size budget exceeded (or Overlay leaked into /native).",
  );
  process.exit(1);
}
