# Plan: initialize the Omniselect source tree (built on `@zealakit/overlay` from npm)

Status: **implemented (not yet committed)**. Release target: **none** (this plan scaffolds the repo;
the first publishable version comes from the component plans that follow).

Order: **0 of N**. Runs first, on an empty repo (`LICENSE` + one initial commit). Later plans
(`01-…`) add the components themselves.

## Scope rule (read first)

This plan creates the **repository shape, tooling, agent guidance, docs skeleton and an empty
but buildable package set**. It copies from the sibling repos:

- **`../overlay`** — tooling, scripts, monitor, `.agents/` layout, README system, and the
  private-Core-bundled-into-adapters release model.
- **`../disclosure`** — the `plans/` folder convention and the "intentional differences"
  documentation style.

**Floating behavior comes from Overlay on npm, not from copied code.** Each Omniselect adapter
depends on the published Overlay adapter for the same framework
(`@zealakit/omniselect-react` → `@zealakit/overlay-react`, etc.). Omniselect never copies Overlay
source and never imports `@zealakit/overlay-core` (private, not on npm).

It does **not** implement Select/Combobox behavior. Per the shared hard rule "no speculative or
unimplemented APIs", every `src/index.ts` created here exports only what actually works.
Component APIs land in plan 01+.

**Acceptance test:** on a clean clone, `pnpm install && pnpm check && pnpm readme:check` pass,
`pnpm pack:packages` produces four self-contained adapter tarballs in `artifacts/` whose only
`@zealakit/*` runtime dependency is the matching `@zealakit/overlay-<fw>`, and each `dev:*`
example starts.

---

## 1. What the two repos have in common (the template)

Verified in both checkouts. Everything in this table is copied as-is, with names changed.

| Concern | Overlay = Disclosure (target for Omniselect) |
| --- | --- |
| Monorepo | pnpm workspace, `packages/*` + `examples/*`, `packageManager: pnpm@12.18.0` |
| Root `package.json` | `private`, `type: module`, author `nqhed - Huy Ed. Nguyen`, MIT, repo `zealakit/<name>` |
| Toolchain | `typescript ^6.0.3`, `@biomejs/biome 2.6.8`, `@types/node ^24.19.0` |
| `tsconfig.base.json` | ES2022, `NodeNext`, strict, `verbatimModuleSyntax`, `noEmit`, `types: []` |
| Build | `rm -rf dist && tsc -p tsconfig.json` (Svelte: `svelte-package -i src -o dist`). ESM only, no bundler |
| Tests | `node --import ./tests/setup.ts --test tests/*.test.ts` against `dist`, happy-dom, `.ts` only |
| Test libs | React `@testing-library/react` (no JSX, `createElement as h`); Vue `@vue/test-utils`; Svelte/Vanilla plain DOM |
| Package manifest | `engines.node >=20`, `sideEffects: false` (Svelte `["**/*.svelte"]`), `files: [dist, README*.md, LICENSE]`, `exports {types, import, default}`, `publishConfig.access: public`, `prepack: pnpm run build` |
| Peers | React `^18.0.0 \|\| ^19.0.0`, Vue `^3.5.0`, Svelte `^5.0.0` |
| Root scripts | `build`, `build:*`, `typecheck`, `test`, `lint`, `lint:fix`, `format`, `check`, `clean`, `dev:*`, `monitor`, `readme:check`, `pack:packages`, `release:check`, `npm:publish:*` |
| Agent guidance | `.agents/{AGENTS.md, rules/<name>.mdc, skills/{<name>,readme-system}/SKILL.md}`; `AGENTS.md`, `CLAUDE.md`, `.cursor` are symlinks into `.agents/` |
| Docs | Root + per-package `README.md`, `README_VI.md`, `README_CN.md`. No `docs/` folder |
| User-facing skills | `skills/<name>-{react,vue,svelte,vanilla}.md` |
| Other | `monitor/` (dep dashboard, `pnpm monitor`, port 4177), `assets/images/` cover, `.vscode/settings.json` (cSpell), `biome.json`, `.gitignore` incl. `artifacts/` |
| Publishing | Manual only, `scripts/npm-publish.ts`, no CI, all packages share one version |

Where they differ, and what Omniselect picks:

| Concern | Overlay | Disclosure | Omniselect |
| --- | --- | --- | --- |
| Shared runtime | Private `core` bundled into adapters | None, mirrored per package | Private **logic-only** `core` bundled into adapters (§2.2) |
| Positioning, layers, dismissal, focus, portal | Own Core over `@floating-ui/dom` | n/a | **`@zealakit/overlay-<fw>` from npm** (§2.1) |
| Animation | WAAPI, off by default, 160ms | CSS grid height, on by default, 200ms | **Overlay's**, through the Overlay adapter, off by default |
| Cross-repo check | — | `check:animation` vs `../overlay` source | None: the contract is the npm package's public API and types |
| `plans/` | no | yes | **yes** |
| Examples | vanilla, react, vue, svelte, nextjs, astro | no astro | **vanilla, react, vue, svelte, nextjs** (astro later) |
| Vue source | render functions in `.ts` | `.ts`, no SFCs | `.ts`, no SFCs |
| Svelte source | `.svelte` in `src/parts/` | `.svelte` flat in `src/` | `.svelte` in `src/parts/` (Overlay) |

---

## 2. Architecture

### 2.1 Overlay dependency (decided)

| Omniselect package | Depends on (npm) | What it uses from Overlay |
| --- | --- | --- |
| `@zealakit/omniselect-vanilla` | `@zealakit/overlay-vanilla ^1.0.0` | `createFloating`, `createOverlay`, `createLayerStack`, focus helpers, `Placement`, `DismissReason` |
| `@zealakit/omniselect-react` | `@zealakit/overlay-react ^1.0.0` | `usePositioner`, `useLayer`, `useOverlay`, `useEscapeKey`, `Portal`, focus helpers, `Animation*` types |
| `@zealakit/omniselect-vue` | `@zealakit/overlay-vue ^1.0.0` | `usePositioner`, `useLayer`, `useOverlay`, `useEscapeKey`, focus helpers |
| `@zealakit/omniselect-svelte` | `@zealakit/overlay-svelte ^1.0.0` | `floating`/`layer`/`overlay`/`outsideInteraction`/`escapeKey`/`portal` actions, `createPositioner`, `createLayer` |

Rules that follow:

- Listed in **`dependencies`** (not `peerDependencies`), caret range on the current major. pnpm
  and npm dedupe it with an app's own copy of the same Overlay adapter.
- Use the **low-level** Overlay APIs above, not `Popover` components, so the listbox controls its
  own ARIA (`role="listbox"`, `aria-activedescendant`) instead of inheriting Popover's dialog
  semantics.
- **Layer stack is shared automatically:** Overlay keeps it on `globalThis` (versioned
  `Symbol.for` key), so a Select inside an Overlay Dialog closes first on Escape and is not an
  "outside click" for the Dialog. Plan 01 adds a test for that nesting.
- Only Overlay's documented public exports are used. Never deep-import `dist/vendor/core/*`.
- Re-export Overlay types that appear in Omniselect's public props (`Placement`,
  `DismissReason`, `AnimationSetting`, …) from each adapter's `src/index.ts`, so apps never need
  to import Overlay themselves just for types.
- Upgrading Overlay is a normal dependency bump gated by Omniselect's tests.

**Upstream gaps found in Overlay 1.0.0** (track in Overlay, not fixed here):
- Only `overlay-react` exports the `Animation*` types; `overlay-vanilla`, `-vue` and `-svelte`
  do not. Omniselect's Vue/Svelte/Vanilla adapters cannot type an `animation` option until
  Overlay exports them (or Omniselect re-declares the shape, which breaks single-sourcing).
- `overlay-react` and `overlay-vue` export `LayerStack` types but not `createLayerStack`;
  only `overlay-vanilla` does. Fine for now (hooks cover it), note it in the skill.

**Developing against unreleased Overlay changes:** do not `link:` into `../overlay/packages/*`
(their source depends on `workspace:^` Core, which only gets bundled at pack time). Instead run
`pnpm pack:packages` in `../overlay` and temporarily install the tarball from
`../overlay/artifacts/`. Never commit that override.

### 2.2 `@zealakit/omniselect-core` (private, logic only)

Select/Combobox has framework-independent logic that four adapters must not duplicate:
selection model (single/multiple, controlled/uncontrolled), option registry and ordering,
keyboard navigation (Home/End/PageUp/PageDown, wrap, disabled skip), typeahead, filtering,
active-descendant tracking, and id generation.

- `"private": true`, never published, vendored into each adapter tarball under
  `dist/vendor/core/` by `scripts/bundle-core.mjs` (copied from Overlay).
- **Zero runtime dependencies.** Core does **not** import Overlay, Floating UI, or any framework.
  Floating/layer/dismissal glue lives in the adapters, next to the Overlay adapter it calls.
- Page-global state (if any, e.g. id counter) goes through a `getGlobalState()` helper using a
  `Symbol.for("@zealakit/omniselect-core/v1/<name>")` key — same pattern as Overlay, separate
  namespace.
- Dependency direction: adapters → omniselect-core and adapters → overlay-<same fw>. Core never
  → adapter. No adapter imports another Omniselect adapter or a different-framework Overlay
  adapter.

### 2.3 Decisions still open

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | Product scope for v1 | **Superseded by `01-architecture.md` §1**: full BRD scope, phased (`NativeSelect`, `Select` with optional `Input`, multi, `LoadMore`). Still out: virtualization, creatable options, built-in tag components |
| D2 | Package names | `@zealakit/omniselect-core` (private), `@zealakit/omniselect-{vanilla,react,vue,svelte}`; repo `zealakit/omniselect`; root `name: "@zealakit/omniselect"` |
| D3 | Overlay type gaps (§2.1) | Fix upstream in Overlay first (export `Animation*` from all adapters), then bump. Until then, ship `animation` in React only — or defer `animation` entirely to keep the four adapters aligned |

---

## 3. Target tree

```text
omniselect/
├── .agents/
│   ├── AGENTS.md                      # hard rules, commands, boundaries
│   ├── rules/omniselect.mdc           # editor always-apply rule
│   └── skills/
│       ├── omniselect/SKILL.md        # architecture + change workflow
│       └── readme-system/SKILL.md     # copied from overlay, Profile edited
├── AGENTS.md    -> .agents/AGENTS.md
├── CLAUDE.md    -> .agents/AGENTS.md
├── .cursor      -> .agents
├── .vscode/settings.json
├── assets/images/omniselect-cover.svg
├── examples/{vanilla,react,vue,svelte,nextjs}/
├── monitor/{README.md,index.html,server.ts,tsconfig.json,reports/.gitkeep}
├── packages/
│   ├── core/       # @zealakit/omniselect-core (private, no deps)
│   ├── vanilla/    # @zealakit/omniselect-vanilla  -> @zealakit/overlay-vanilla
│   ├── react/      # @zealakit/omniselect-react    -> @zealakit/overlay-react
│   ├── vue/        # @zealakit/omniselect-vue      -> @zealakit/overlay-vue
│   └── svelte/     # @zealakit/omniselect-svelte   -> @zealakit/overlay-svelte
├── plans/00-init-src.md               # this file
├── scripts/
│   ├── bundle-core.mjs
│   ├── check-readmes.mjs
│   ├── npm-publish.ts
│   ├── pack-packages.mjs
│   └── tsconfig.json
├── skills/omniselect-{vanilla,react,vue,svelte}.md
├── README.md, README_VI.md, README_CN.md
├── LICENSE                            # exists (MIT © 2026 Zealakit)
├── .gitignore
├── biome.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Per package (all five):

```text
packages/<p>/
  package.json  tsconfig.json  LICENSE  README.md  README_VI.md  README_CN.md
  src/index.ts
  tests/{setup.ts, support/dom.ts, tsconfig.json, *.test.ts}
```

---

## 4. Root files

1. **`package.json`** — copy `overlay/package.json`; replace `overlay` → `omniselect`
   everywhere; description "Accessible, headless Select and Combobox primitives for modern
   UIs."; keywords `select, combobox, listbox, multiselect, autocomplete, headless, a11y, ui,
   zealakit, react, vue, svelte, vanilla`. Drop `dev:astro`. `clean`:
   `pnpm -r exec rm -rf dist .next && rm -rf artifacts`.
2. **`pnpm-workspace.yaml`** — packages `packages/*`, `examples/*`; `allowBuilds.esbuild: true`
   (add `sharp` only if an example needs it); `minimumReleaseAgeExclude` = the Biome 2.6.8 list.
   If the minimum-release-age policy blocks a fresh Overlay release, add that exact
   `@zealakit/overlay-<fw>@x.y.z` entry here rather than disabling the policy.
3. **`tsconfig.base.json`** — copy Overlay's verbatim.
4. **`biome.json`** — copy Overlay's; drop `.astro` entries; keep the
   `examples/vanilla/index.html` override.
5. **`.gitignore`** — copy Overlay's; drop `.astro` lines.
6. **`.vscode/settings.json`** — Overlay's `cSpell.words` minus astro, plus `omniselect`,
   `listbox`, `combobox`, `activedescendant`, `typeahead`, `multiselect`.
7. **Symlinks** — `ln -s .agents/AGENTS.md AGENTS.md`, `ln -s .agents/AGENTS.md CLAUDE.md`,
   `ln -s .agents .cursor`.

## 5. Packages

### 5.1 `packages/core` (`@zealakit/omniselect-core`)

- `package.json`: shape of `overlay/packages/core/package.json`, renamed, `private: true`,
  **no `dependencies`**, `devDependencies: { happy-dom ^21.0.4 }`.
- `tsconfig.json`, `tests/tsconfig.json`, `tests/setup.ts`, `tests/support/dom.ts`: copy from
  Overlay Core.
- `src/utils/global-state.ts` (Omniselect namespace, §2.2) + `src/index.ts`. Nothing else until
  plan 01; no placeholder logic.
- `tests/global-state.test.ts` and `tests/bundled-copies.test.ts` (two copies share state),
  modeled on Overlay's.
- README set (EN/VI/CN) stating it is internal and never installed, as Overlay's Core README does.

### 5.2 Adapters (`vanilla`, `react`, `vue`, `svelte`)

- `package.json`: copy the matching Overlay adapter manifest; rename; description
  "Accessible, headless Select and Combobox primitives for <Framework>."; keep peers and
  devDependencies;
  `dependencies: { "@zealakit/omniselect-core": "workspace:^", "@zealakit/overlay-<fw>": "^1.0.0" }`.
- `tsconfig.json` / `tests/tsconfig.json` / `tests/setup.ts` / `tests/support/dom.ts`: copy
  from Overlay (Svelte keeps the `registerHooks` `.svelte` loader and `--conditions=browser`;
  React keeps `"use client"` at the top of `src/index.ts`, as Overlay React does).
- `src/index.ts`: **no component exports yet.** Only the Overlay type re-exports from §2.1
  (`Placement`, `DismissReason`, and `Animation*` where Overlay exports them).
- `tests/ssr.test.ts`: imports `../dist/index.js` with no DOM globals (Overlay pattern). This
  also proves the Overlay npm package resolves and is SSR-safe through Omniselect.
- `LICENSE`: copy root LICENSE.

## 6. Scripts

| File | Source | Changes |
| --- | --- | --- |
| `bundle-core.mjs` | overlay | `CORE_NAME = "@zealakit/omniselect-core"`, specifier regex. Core has no runtime deps, so nothing is added back; the Overlay adapter dependency stays untouched |
| `pack-packages.mjs` | overlay | package list → omniselect adapters |
| `npm-publish.ts` | overlay | package map, names; requires `dist/index.js` + `dist/index.d.ts` |
| `check-readmes.mjs` | overlay | unit list, repo URL |
| `tsconfig.json` | disclosure | as-is |

Tarball inspection (add to `npm-publish.ts` check and the skill's Release section): no
`workspace:`; no `@zealakit/omniselect-core` outside `dist/vendor/core/`; exactly one
`@zealakit/overlay-<fw>` dependency matching the adapter's framework; no
`@zealakit/overlay-core` anywhere.

## 7. Agent guidance (`.agents/`)

Write fresh, using Overlay's as the template (Disclosure `plans/03-agents.md` is the checklist
of what a complete `.agents/` contains):

- **`AGENTS.md`** — sections: intro + single-source paragraph; Always follow; Quick map;
  Commands; Docs; Hard boundaries; Definition of done. Hard boundaries = Overlay's (tests, SSR
  safety, TypeScript, naming, public packaging, documentation) **plus**:
  - Floating UI, layers, dismissal, focus, portal come **only** from `@zealakit/overlay-<fw>`
    via its public exports. Never copy Overlay code, never import `@zealakit/overlay-core` or
    `@floating-ui/*`, never deep-import Overlay's `dist`.
  - Each adapter imports only its own framework's Overlay adapter.
  - `@zealakit/omniselect-core` has no runtime dependencies and no DOM-framework or Overlay
    imports.
  - Scope: Select and Combobox only; no speculative exports.
  - `plans/` are proposals, not docs.
- **`rules/omniselect.mdc`** — Overlay's rule, renamed, with the Overlay-dependency bullets
  above replacing "only Core imports Floating UI".
- **`skills/omniselect/SKILL.md`** — Overlay's SKILL.md structure (Map, Tree, Boundaries,
  Change workflow, Framework notes, Verification, Release, Documentation, Reuse). Replace
  "Positioning engine decision" with **"Overlay dependency"** (§2.1: which APIs, why low-level
  APIs not Popover, shared layer stack, upgrade policy, unreleased-Overlay workflow). Add an
  **"ARIA pattern"** section pinning the WAI-ARIA APG patterns: select-only combobox, editable
  combobox with listbox popup, `aria-activedescendant` focus model.
- **`skills/readme-system/SKILL.md`** — copy Overlay's; edit only the Profile table and the
  canonical `> **Note**` (§8).

## 8. Docs skeleton

Follow the readme-system skill. 3 languages × (root + 5 packages) = **18 READMEs**.

- Root: H1 `Zealakit Omniselect`, language switcher, cover, tagline, Note, `## Packages`
  table (4 public adapters), `## Installation`, `## Examples`, `## Agent Skills`, `## License`
  (`MIT © Zealakit`). Mention that each adapter installs its Overlay adapter automatically.
- Canonical Note (EN, translated for VI/CN):
  > **Note**
  > Omniselect is a focused, headless set of primitives for Select and Combobox, built on
  > Zealakit Overlay. It ships no CSS and renders no styled markup. Async loading,
  > virtualization, creatable options, and tag inputs are not implemented.
- Package READMEs: install + peers + Overlay dependency + "API lands in a later release" —
  kept minimal until plan 01 so `readme:check` passes without documenting unimplemented API.
- `skills/omniselect-<fw>.md`: frontmatter + install/import sections only (same reason). State
  that apps using Overlay alongside Omniselect should keep the Overlay adapter on the same
  major.
- Cover: `assets/images/omniselect-cover.svg` in the Overlay/Disclosure style.

## 9. Examples and monitor

- `examples/{vanilla,react,vue,svelte,nextjs}`: copy Overlay's Vite configs / Next config,
  rename to `@zealakit/omniselect-<fw>-example`, depend on `workspace:*` Omniselect adapters,
  render a single placeholder page. Plan 01 adds a "Select inside an Overlay Dialog" demo per
  example, so each example will also list `@zealakit/overlay-<fw>` directly.
- `monitor/`: copy Overlay's as-is; update title and package list in `index.html` so it also
  tracks the four `@zealakit/overlay-*` versions.

## 10. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P0 | Confirm D1–D3 | user sign-off |
| P1 | Root files (§4), symlinks, `pnpm install` | lockfile created; `@zealakit/overlay-*@1.0.0` resolved from npm |
| P2 | `packages/core` (§5.1) | `pnpm --filter @zealakit/omniselect-core test` |
| P3 | Four adapters (§5.2) | `pnpm build && pnpm typecheck && pnpm test` |
| P4 | Scripts (§6) | `pnpm pack:packages`; tarball inspection per §6 |
| P5 | `.agents/` (§7) | links resolve; symlinks correct |
| P6 | READMEs, skills, cover (§8) | `pnpm readme:check` |
| P7 | Examples, monitor (§9) | every `dev:*` starts; `examples/nextjs` builds |
| P8 | Full verification | `pnpm check && pnpm readme:check`; commit on a branch |

## 11. Out of scope for this plan

- Any Select/Combobox behavior, controller, or public component API (plan 01+).
- Fixing the Overlay 1.0.0 type-export gaps (§2.1) — an Overlay change, tracked there.
- Publishing to npm, version tags, CI.
- Astro example (add once components exist, mirroring Overlay's).
