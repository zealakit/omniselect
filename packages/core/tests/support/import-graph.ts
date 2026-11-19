import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;

export type ImportGraph = {
  /** Every file reached through relative imports. */
  files: string[];
  /** Every bare (package) specifier found in those files. */
  packages: string[];
};

function resolveRelative(from: string, specifier: string): string | null {
  const base = resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.js`, `${base}/index.js`]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) {
      try {
        readFileSync(candidate);
        return candidate;
      } catch {}
    }
  }
  return null;
}

/** Walk static imports from a built entry file (.js or .svelte). */
export function walkImports(entry: string): ImportGraph {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (files.has(file)) {
      continue;
    }
    files.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(SPECIFIER)) {
      const specifier = match[1] as string;
      if (specifier.startsWith(".")) {
        const next = resolveRelative(file, specifier);
        if (next) {
          queue.push(next);
        }
      } else {
        packages.add(specifier);
      }
    }
  }
  return { files: [...files], packages: [...packages] };
}
