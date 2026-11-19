---
name: omniselect-architecture
description: >-
  Use for any Zealakit Omniselect code, test, documentation, or release work:
  deciding where logic belongs, implementing packages, keeping Core and
  adapters separated, using the Overlay dependency, validating behavior, and
  packaging releases.
---

# Zealakit Omniselect

Read `.agents/AGENTS.md` first. Keep this file compact.

## Map

```text
vanilla ─┐                      ┌─> @zealakit/omniselect-core (private, no deps)
react ───┤  adapters import ────┤
vue ─────┤                      └─> @zealakit/overlay-<same framework> (npm)
svelte ──┘

examples/* -> adapters
READMEs (EN/VI/CN) -> product documentation
```

- **Core** (`packages/core`) owns framework-independent logic: selection model, option
  collection, keyboard navigation, type-ahead, filtering, ids. It has no DOM-framework or
  Overlay imports.
- **Adapters** own framework lifecycle and idiomatic APIs, and glue to the matching Overlay
  adapter for positioning, layers, dismissal, focus, and portal.
- **Docs** live only in the root and package READMEs (EN, VI, CN), structured by the
  [readme-system skill](../readme-system/SKILL.md). There is no `docs/` folder.

## Tree

```text
omniselect/
├── .agents/
│   ├── AGENTS.md                  # hard rules, commands, boundaries
│   ├── rules/omniselect.mdc       # editor always-apply rule
│   └── skills/
│       ├── omniselect/SKILL.md    # this workflow
│       └── readme-system/SKILL.md # README structure spec
├── AGENTS.md    -> .agents/AGENTS.md
├── CLAUDE.md    -> .agents/AGENTS.md
├── .cursor      -> .agents
├── assets/images/                 # README cover image
├── examples/                      # vanilla, react, vue, svelte, nextjs
├── packages/{core,vanilla,react,vue,svelte}/   # src/, tests/, generated dist/
├── monitor/                       # local dependency dashboard
├── plans/                         # implementation proposals
├── scripts/                       # packaging + README check
├── skills/omniselect-*.md         # user-facing integration skills
└── README.md, README_VI.md, README_CN.md
```

## Boundaries

- Dependency direction: adapters → Core, adapters → same-framework Overlay adapter.
- Core never imports an adapter, a framework, or Overlay. No adapter imports another adapter.
- No default CSS or styling system.
- No speculative APIs, placeholders, or unimplemented components.
- Keep `workspace:^` for Core in adapter manifests.

## Overlay dependency

| Omniselect package | Depends on (npm) | Low-level APIs used |
| --- | --- | --- |
| vanilla | `@zealakit/overlay-vanilla` | `createFloating`, `createOverlay`, `createLayerStack`, focus helpers |
| react | `@zealakit/overlay-react` | `usePositioner`, `useLayer`, `useOverlay`, `useEscapeKey`, `Portal`, focus helpers |
| vue | `@zealakit/overlay-vue` | `usePositioner`, `useLayer`, `useOverlay`, `useEscapeKey`, focus helpers |
| svelte | `@zealakit/overlay-svelte` | `floating`, `layer`, `overlay`, `outsideInteraction`, `escapeKey`, `portal` actions |

- Use low-level APIs, not Overlay's `Popover` components, so the listbox controls its own ARIA
  (`role="listbox"`, `aria-activedescendant`) instead of inheriting dialog semantics.
- The layer stack is shared through `globalThis`, so a Select inside an Overlay Dialog closes
  first on Escape and is not an "outside click" for the Dialog.
- Only documented public exports are used. Re-export Overlay types that appear in Omniselect's
  public props (`Placement`, `DismissReason`, and `Animation*` where Overlay exports them).
- Known upstream gaps (Overlay 1.0.0): only `overlay-react` exports the `Animation*` types;
  `createLayerStack` is exported only by `overlay-vanilla`.
- Unreleased Overlay changes: run `pnpm pack:packages` in `../overlay`, install the tarball from
  `../overlay/artifacts/` temporarily, never commit the override.

## ARIA pattern

- Select-only (no `Select.Input`): APG **select-only combobox**. `role="combobox"` on the
  trigger, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`.
- With `Select.Input`: APG **editable combobox with list autocomplete**. `role="combobox"` on
  the input with `aria-autocomplete="list"`; the trigger becomes a `tabindex="-1"` button.
- Focus model: `aria-activedescendant` only; DOM focus never moves into the list.

## Conformance suite

Behavior is specified once, in `packages/core/tests/conformance/` (framework-neutral scenarios made of part names,
steps, and expectations), and run against every adapter through a small driver. New behavior = a new scenario first, then
implement it in the core machine, then make each adapter pass. A scenario that an adapter cannot express carries an
explicit `skip` with a reason (never a silent omission). Helpers serialize forms by hand (happy-dom's `FormData` drops
all but the first value of a `<select multiple>`) and avoid putting DOM nodes in failing assertions (inspecting them hangs).

## Change workflow

1. Identify the owning package and existing tests.
2. Put shared contracts and logic in Core; framework lifecycle and Overlay glue in the adapter.
3. Use TypeScript `type` aliases, `import type`, explicit `.js` relative imports.
4. Keep imports SSR-safe: no browser globals at module init or during render.
5. Clean up listeners, observers, layers, portals, and focus handling.
6. Export only implemented public APIs and their types from `src/index.ts`.
7. Add focused tests in the owning package; run `pnpm check`.
8. Update the READMEs (all three languages) when public behavior changes; load the
   [readme-system skill](../readme-system/SKILL.md) and run `pnpm readme:check`.

### Framework notes

- **React:** `"use client"` where required; refs/effects; Strict Mode cleanup.
- **Vue:** render-function components in `.ts` (no SFCs); `MaybeRefOrGetter`, shallow refs,
  `onScopeDispose`.
- **Svelte:** Svelte 5; the package builds with `svelte-package` (not plain `tsc`); components
  live in `src/parts/` and are re-exported from `src/index.ts`. Tests compile `.svelte` files
  through a `registerHooks` loader in `tests/setup.ts`.
- **Vanilla:** `destroy()` restores listeners and ARIA/DOM state.

## Verification

```bash
pnpm --filter @zealakit/omniselect-<pkg> run typecheck
pnpm --filter @zealakit/omniselect-<pkg> run test
pnpm check
```

- Tests use Node + happy-dom, React Testing Library, Vue Test Utils, and compiled Svelte
  fixtures. Do not add a second test framework/DOM library.
- For real layout, scroll, or focus bugs, verify in a browser against an example.
- Never publish or require credentials unless explicitly asked.

## Release

- All five packages share one version. Vanilla, React, Vue, and Svelte are the only packages on
  npm. Core is private: adapters keep `workspace:^` in the repository, and
  `scripts/bundle-core.mjs` (used by `pnpm pack:packages` and the publish script) vendors the
  built Core into each tarball under `dist/vendor/core/` and rewrites the imports.
- Page-global state in Core lives on `globalThis` via `getGlobalState()`; bump its version when
  a stored shape changes. `tests/bundled-copies.test.ts` guards this.
- Peer ranges: React `^18.0.0 || ^19.0.0`, Vue `^3.5.0`, Svelte `^5.0.0`.
- Preflight: `pnpm install --frozen-lockfile`, `pnpm clean`, `pnpm check`, `pnpm readme:check`,
  build every example, then `pnpm pack:packages` (tarballs in `artifacts/`, no publish).
- Inspect each adapter tarball: only `package.json`, `README*.md`, `LICENSE`, and `dist/**`; no
  `workspace:`; no `@zealakit/omniselect-core` outside `dist/vendor/core/`; exactly one
  `@zealakit/overlay-<fw>` dependency and no `@zealakit/overlay-core` anywhere; `main`/`module`/
  `types`/`exports` point into `dist`; no sources, tests, source maps, or credentials.
- Validate tarballs in temporary projects outside the repository, never with `workspace:*`
  aliases.
- Publishing is manual and needs explicit authorization: `pnpm npm:publish:check`, then
  `pnpm npm:publish:all` (or one adapter command). No CI or automated publishing. Tag `vX.Y.Z`
  only after preflight.

## Documentation

- READMEs are the only product documentation; follow the
  [readme-system skill](../readme-system/SKILL.md).
- User-facing integration skills live in `skills/omniselect-<framework>.md`; internal agent
  guidance stays in `.agents/`. Link the former from the READMEs, never the latter.
- Use absolute GitHub links, because npm breaks relative ones.
- Document implemented behavior only; state limitations clearly.
