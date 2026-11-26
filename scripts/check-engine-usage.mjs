#!/usr/bin/env node
/**
 * G1 `check:engine-usage` (00-foundation-2 §1).
 *
 * Fails when a published overlay package:
 *  - lists the engine or another `@zealakit/*` component in `dependencies`
 *    (NS1, spec §2.2), or a package that never imports the engine declares it;
 *  - imports the engine while missing the peer, or with the wrong peer range
 *    (X23: `/internal` importers pin the exact `1.0.0-beta.1`, others use `^1.0.0-beta.1`);
 *  - still duplicates engine-owned behaviour: its own `getGlobalState` or
 *    `Symbol.for("@zealakit/` key, an announcement live region it creates, or a
 *    document-level dismissal listener (NQ2);
 *  - deep-imports `@zealakit/ui-engine/dist/...` or a subpath outside the
 *    public entry set (NQ7), or reads an engine protocol key string (NS5);
 *  - uses an HTML/CSS sink the engine bans (NS3).
 *
 * Every allow-list entry names the decision or plan step that keeps it, and the
 * list must shrink, never grow, without one.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { expectedEnginePeer } from "./lib/engine-peer.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PACKAGES = ["core", "vanilla", "react", "vue", "svelte"];
const ENGINE = "@zealakit/ui-engine";
const PUBLIC_SUBPATHS = new Set([
  ENGINE,
  `${ENGINE}/pointer`,
  `${ENGINE}/keyboard`,
  `${ENGINE}/position`,
  `${ENGINE}/presence`,
  `${ENGINE}/internal`,
  `${ENGINE}/package.json`,
]);

/**
 * Files allowed to keep a duplicate, with the decision or plan step that keeps it.
 *
 * @type {ReadonlyArray<{ file: string; rule: string; reason: string }>}
 */
const ALLOW_LIST = [];

const failures = [];

/** @param {string} code @param {string} message */
function fail(code, message) {
  failures.push(`[${code}] ${message}`);
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** @param {string} relative @param {string} rule */
function allowed(relative, rule) {
  return ALLOW_LIST.some((entry) => entry.file === relative && entry.rule === rule);
}

const SOURCE_BANS = [
  { pattern: /dangerouslySetInnerHTML|v-html|\{@html/g, code: "NS3", what: "framework HTML sink" },
  { pattern: /\.(inner|outer)HTML\s*=/g, code: "NS3", what: "innerHTML/outerHTML sink" },
  {
    pattern: /insertAdjacentHTML|createContextualFragment|new DOMParser|\.srcdoc\s*=/g,
    code: "NS3",
    what: "HTML parsing sink",
  },
  { pattern: /document\.write\(|new Function\(|\beval\(/g, code: "NS3", what: "eval-family sink" },
  { pattern: /setAttribute\(\s*["']style["']/g, code: "NS3", what: "style attribute sink" },
  { pattern: /\.style\.cssText\s*=/g, code: "NS3", what: "style.cssText sink" },
];

for (const name of PACKAGES) {
  const packageDir = path.join(rootDir, "packages", name);
  const manifestPath = path.join(packageDir, "package.json");
  if (!existsSync(manifestPath)) {
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const published = manifest.private !== true;
  const srcFiles = walk(path.join(packageDir, "src")).filter((file) =>
    /\.(ts|tsx|js|svelte|vue)$/.test(file),
  );
  const srcText = srcFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  // An adapter bundles Core, so it uses the engine through the built output even
  // though its own source never imports it (spec §2.2, NP5).
  const distText = walk(path.join(packageDir, "dist"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  // An adapter vendors Core into its tarball, so depending on Core means using
  // the engine the Core imports (spec §2.2, NP5).
  const importsEngine =
    srcText.includes(ENGINE) ||
    /@zealakit\/ui-engine/.test(distText) ||
    manifest.dependencies?.["@zealakit/omniselect-core"] !== undefined;

  // Manifest rules (NS1, spec §2.2).
  if (published && importsEngine) {
    const peer = manifest.peerDependencies?.[ENGINE];
    if (peer === undefined) {
      fail("NS1", `${name}: imports ${ENGINE} but has no peerDependencies entry`);
    } else {
      const internal = srcText.includes(`${ENGINE}/internal`);
      const expected = expectedEnginePeer(internal);
      if (peer !== expected) {
        fail(
          "X23",
          `${name}: peer ${ENGINE} is "${peer}", expected "${expected}"${internal ? " (imports /internal)" : ""}`,
        );
      }
    }
  }
  if (!importsEngine && published) {
    for (const field of ["dependencies", "peerDependencies", "devDependencies"]) {
      if (manifest[field]?.[ENGINE] !== undefined) {
        fail("NS1", `${name}: never imports ${ENGINE} but declares it in ${field}`);
      }
    }
  }
  for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
    if (dependency === ENGINE) {
      fail("NS1", `${name}: lists ${ENGINE} in dependencies; it must be a peer`);
    } else if (dependency.startsWith("@zealakit/") && dependency !== "@zealakit/omniselect-core") {
      fail(
        "NS1",
        `${name}: lists ${dependency} in dependencies; cross-component deps are peers only`,
      );
    }
    if (typeof range === "string" && /^(link|file):/.test(range) && published) {
      fail("NS2", `${name}: ${dependency} resolves through "${range}" in a published manifest`);
    }
  }

  for (const file of srcFiles) {
    const relative = path.relative(rootDir, file);
    const source = readFileSync(file, "utf8");

    // Import rules (NQ7, NS5).
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\()\s*["']([^"']*@zealakit\/ui-engine[^"']*)["']/g,
    )) {
      const specifier = match[1];
      if (!PUBLIC_SUBPATHS.has(specifier)) {
        fail(
          "NQ7",
          `${relative}: imports "${specifier}" (only the public entry points are allowed)`,
        );
      }
    }
    if (/Symbol\.for\(\s*["']@zealakit\/ui-engine/.test(source)) {
      fail("NS5", `${relative}: reads an engine protocol key directly`);
    }

    // Duplicate rules (NQ2).
    if (
      /(?:export\s+)?function\s+getGlobalState/.test(source) &&
      !allowed(relative, "get-global-state")
    ) {
      fail("NQ2", `${relative}: defines its own getGlobalState`);
    }
    if (
      /getGlobalState\s*(?:<[^>]*>)?\s*\(/.test(source) &&
      !allowed(relative, "get-global-state")
    ) {
      fail("NQ2", `${relative}: reads package-global state through its own getGlobalState`);
    }
    if (/Symbol\.for\(\s*["']@zealakit\/(?!ui-engine)/.test(source)) {
      fail("NQ2", `${relative}: defines its own page-global Symbol.for key`);
    }
    if (
      /setAttribute\(\s*["']aria-live["']/.test(source) ||
      /setAttribute\(\s*["']role["']\s*,\s*["'](?:status|alert)["']/.test(source) ||
      /["']aria-live["']\s*:/.test(source)
    ) {
      fail(
        "NQ2",
        `${relative}: creates its own announcement live region (use the engine announce)`,
      );
    }
    const documentListener =
      /document\.addEventListener\(\s*["'](keydown|pointerdown|mousedown)["']/;
    if (documentListener.test(source) && !allowed(relative, "document-keydown")) {
      fail(
        "NQ2",
        `${relative}: adds a document-level dismissal listener; register a layer instead`,
      );
    }

    // Source bans (NS3).
    for (const ban of SOURCE_BANS) {
      if (ban.pattern.test(source)) {
        fail(ban.code, `${relative}: ${ban.what}`);
      }
      ban.pattern.lastIndex = 0;
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  console.error(`\ncheck-engine-usage: ${failures.length} violation(s).`);
  process.exit(1);
}

console.log(
  `check-engine-usage: OK (${PACKAGES.length} packages, ${ALLOW_LIST.length} allow-listed exception(s)).`,
);
