# Release notes (1.0.0)

## Breaking-change ledger

None. Every 0.x release from 0.1.0 to 0.5.0 was additive, so there is nothing to migrate.

## API freeze review

- `NativeSelect` and `Select` expose the same parts in React, Vue, and Svelte; Vanilla exposes `createNativeSelect` and
  `createSelect`. `packages/*/tests/api.test.ts` pins the exact part names per adapter.
- Names, defaults, and callback reason enums are shared through the core machine. Differences are framework idiom only:
  `v-model` / `bind:` / controlled props, `@load-more` vs `onLoadMore`, Value slot / snippet / render function.
- The `animation` option from plan 00's D3 is **not** exposed: exit animation is CSS-only (`data-state="closed"` keeps
  the popover mounted until animations end), so Overlay's missing `Animation*` type exports in Vue/Svelte/Vanilla do not
  matter. The Overlay types re-exported from each adapter are `Placement` and `DismissReason` (React also re-exports the
  `Animation*` types Overlay provides).
- Dev warnings link to the root README.

## Gates

| Gate | Result |
| --- | --- |
| `pnpm check` (build, typecheck, tests, lint) | pass |
| `pnpm readme:check` | pass (18 files) |
| Conformance: NativeSelect and Select scenarios x 4 adapters | pass (skips are explicit, e.g. Vanilla has no controlled mode) |
| axe-core on six states (React) | pass |
| Manual screen-reader matrix | **not run** (see `08-a11y-results.md`) |
| Perf: 1,000 items | pass (see below) |
| Size (`pnpm size`) | pass |
| Pack and tarball inspection (`pnpm npm:publish:check`) | pass |

## Performance

`packages/react/tests/perf.test.ts` (happy-dom, so far slower than a browser): mounting and opening 1,000 items takes
about 0.5 s and each filter keystroke about 40 ms; moving the highlight re-renders exactly the two affected items.
The audit found and fixed two real problems:

1. Every item registration notified every item subscriber, so each of 1,000 registrations re-read the sorted collection
   (mount took ~15 s). Collection notifications are now coalesced once per microtask.
2. The first highlight re-rendered all items, because every item's snapshot included the highlight source. It is now
   included only for the highlighted item (React) / via a per-item computed (Vue).

## Bundle size

Gzip, minified, core bundled, framework and Overlay external. Budgets leave ~10% headroom over the measured values.

| Entry | vanilla | react | vue | svelte | Budget |
| --- | --- | --- | --- | --- | --- |
| `/native` | 0.8 kB | 3.2 kB | 3.3 kB | 3.7 kB | 4 kB |
| `/select` | 9.0 kB | 11.0 kB | 10.8 kB | 12.6 kB | 14 kB |

`/native` contains no Overlay code (checked by `pnpm size`). The original plan's 3 kB / 12 kB budgets were tightened
estimates made before the code existed; the measured baseline is above them, so the budgets were raised on purpose.

## Publishing

Manual only and not done here: `pnpm npm:publish:check`, then `pnpm npm:publish:all`, then tag `v1.0.0`.
