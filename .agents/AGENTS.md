# Agent instructions (Zealakit Omniselect)

Zealakit Omniselect is a **pnpm monorepo** of headless Select and Combobox primitives for
Vanilla TypeScript, React, Vue, and Svelte. There is one shared, framework-free logic package
(`@zealakit/omniselect-core`); adapters are thin and idiomatic to their framework. Floating
behavior comes from the published **Zealakit Overlay** adapters, not from copied code.

This file is the root agent guidance. `.agents/` is the single source of truth for
repository-specific AI instructions: `AGENTS.md`, `CLAUDE.md`, and `.cursor/` are symlinks
into it — never duplicate instruction content outside `.agents/`.

## Always follow

- **Skill:** [.agents/skills/omniselect/SKILL.md](skills/omniselect/SKILL.md)
- **README skill:** [.agents/skills/readme-system/SKILL.md](skills/readme-system/SKILL.md)
  (load it before touching any README)
- **Rules:** [.agents/rules/](rules/)

Load the omniselect skill before code, test, docs, or release work. Keep hard rules here.

## Quick map

| Area | Path | Package |
| --- | --- | --- |
| Internal framework-agnostic logic | `packages/core/` | `@zealakit/omniselect-core` (private) |
| Imperative DOM adapter | `packages/vanilla/` | `@zealakit/omniselect-vanilla` |
| React adapter | `packages/react/` | `@zealakit/omniselect-react` |
| Vue adapter | `packages/vue/` | `@zealakit/omniselect-vue` |
| Svelte adapter | `packages/svelte/` | `@zealakit/omniselect-svelte` |
| Integration examples | `examples/{vanilla,react,vue,svelte,nextjs}/` | private |
| Product documentation | root `README*.md` + `packages/*/README*.md` (EN, VI, CN) | — |
| User-facing integration skills | `skills/omniselect-*.md` | — |
| Dependency monitor | `monitor/` | local dashboard |
| Release packaging helper | `scripts/pack-packages.mjs`, `scripts/bundle-core.mjs` | — |
| README structure check | `scripts/check-readmes.mjs` | — |
| Agent skills | `.agents/skills/{omniselect,readme-system}/SKILL.md` | — |
| README cover image | `assets/images/omniselect-cover.svg` | — |

## Commands

```bash
pnpm install
pnpm build        # builds packages in topological order (core first)
pnpm typecheck    # requires a successful build (adapters resolve core from dist)
pnpm test         # core + vanilla + react + vue + svelte tests (Node test runner + happy-dom)
pnpm lint         # Biome
pnpm check        # build + typecheck + test + lint
pnpm clean        # remove package/example build output and local tarballs
pnpm pack:packages # pack the four adapter tarballs, Core bundled in, into artifacts/ (no publish)
pnpm release:check # full checks + package tarballs (no publish)
pnpm npm:publish:check # build + test all five, pack/bundle/inspect the four adapters (no publish)
pnpm npm:publish:all   # same preflight, then publish the four adapters (Core is never published)
pnpm size         # gzip budgets per adapter entry (and `/native` must carry no Overlay code)
pnpm readme:check # README structure: EN/VI/CN parity, absolute links, H1 = package name

pnpm dev:vanilla
pnpm dev:react
pnpm dev:vue
pnpm dev:svelte
pnpm dev:nextjs

pnpm monitor      # dependency dashboard at http://127.0.0.1:4177
```

## Hard boundaries

- **Dependency direction:** adapters → `@zealakit/omniselect-core` and adapters → the
  `@zealakit/overlay-<same framework>` adapter. Core never imports React, Vue, Svelte, Overlay,
  or any adapter. No adapter imports another Omniselect adapter or a different framework's
  Overlay adapter. No circular dependencies.
- **Core has zero runtime dependencies** and no DOM-framework or styling code.
- **Floating behavior comes only from `@zealakit/overlay-<fw>`** through its documented public
  exports (positioning, layers, dismissal, focus, portal). Never copy Overlay source, never
  import `@zealakit/overlay-core` (private, not on npm), never import `@floating-ui/*`, never
  deep-import Overlay's `dist`. Use Overlay's low-level APIs, not its `Popover` components, so
  the listbox keeps its own ARIA.
- **Overlay dependency:** listed in `dependencies` (not peer), caret range on the current major.
  Re-export Overlay types that appear in Omniselect's public props from each adapter's
  `src/index.ts`. Upgrading Overlay is a normal dependency bump gated by Omniselect's tests. To
  try unreleased Overlay changes, install a tarball from `../overlay/artifacts/`; never `link:`
  into `../overlay/packages/*` and never commit that override.
- **Tests:** new behavior needs focused tests in the owning package (`packages/*/tests/`);
  run `pnpm test`. Do not add a second test framework or DOM library.
- **SSR safety:** never touch `window`, `document`, `navigator`, or `matchMedia` during module
  initialization or during React/Vue/Svelte render. Guard DOM work behind lifecycle
  effects/actions.
- **TypeScript:** `type` aliases, not `interface` (except ambient declaration merging);
  `import type` for type-only imports; ESM with explicit `.js` relative specifiers.
- **Naming:** files and folders are `kebab-case`; exported React components are `PascalCase`.
- **Package surface:** do not export speculative or unimplemented APIs. No placeholder
  components, no fake implementations.
- **Public packaging:** only the four adapters are published to npm. Core is `"private": true`
  and never published: `scripts/bundle-core.mjs` copies the built Core into each adapter
  tarball (`dist/vendor/core/`), rewrites `@zealakit/omniselect-core` imports to relative paths,
  and drops the Core dependency. Page-global Core state must go through `getGlobalState()`
  (`globalThis` + versioned `Symbol.for` key), never a bare module-level variable, so adapters
  bundling separate copies still share it. Never document Core as an install or configuration
  entry point. Each adapter tarball has exactly one `@zealakit/overlay-*` dependency, the one
  for its own framework.
- **Scope:** Select and Combobox (`Select` with an optional `Select.Input`) plus `NativeSelect`.
  No bundled CSS/themes, no schema validation, no JS animation engine. Virtualization,
  creatable options, and built-in tag components are out of scope unless explicitly requested.
  The public surface is frozen at 1.0.0 (`packages/*/tests/api.test.ts`).
- **Documentation:** There is intentionally no `docs/` folder and no separate docs app. Product
  documentation lives only in the root README and package READMEs, in EN, VI, and CN, following
  the [readme-system skill](skills/readme-system/SKILL.md).
  Keep runnable integration references in `examples/`.

## Definition of done

`pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm readme:check` pass. Examples
still build (and SSR examples build) against the local workspace packages. Update this file and
the [skill](skills/omniselect/SKILL.md) when boundaries, commands, or workflows change.
