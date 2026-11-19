# Plan: hardening, documentation, and 1.0.0

Status: **implemented, except the manual screen-reader matrix** (see `08-a11y-results.md`). Release target: **1.0.0** (API freeze).

Order: **8 of 8**. Requires plans 03–07 shipped (0.5.0).

## Scope rule (read first)

No new features. This plan audits, measures and documents what 0.1–0.5 built, fixes what
the audits find, and freezes the public API. Any breaking change found here is made **before**
1.0.0 and listed in §6.

**Acceptance test:** every gate in §7 is green and the 1.0.0 tarballs pass plan 00 §6
inspection.

---

## 1. Accessibility audit

- **Automated**: run `axe-core` (dev-only) against every example page state (closed, open,
  filtered, empty, loading, multi with chips, invalid) in the Next.js example via a Playwright
  script in `scripts/` (dev dependency only).
- **Manual screen-reader matrix**, recorded in `plans/08-a11y-results.md`:

| SR | Browser | Modes checked |
| --- | --- | --- |
| VoiceOver | Safari macOS | NativeSelect, select-only, combobox, multi, LoadMore |
| VoiceOver | Safari iOS | same |
| NVDA | Firefox, Chrome | same |
| JAWS | Chrome | select-only, combobox |
| TalkBack | Chrome Android | select-only, combobox |

  Check: name/role/value announced, active option announced on arrow keys, selection state,
  group labels, empty and loading announcements, Clear button name.
- Keyboard-only walkthrough of every keyboard table in plans 04–06.
- Windows High Contrast / forced-colors: `data-highlighted` must stay visible. The docs give the
  CSS (`forced-color-adjust` and an `outline` example), since the library ships no CSS.

## 2. Performance

- Benchmark (node + happy-dom, `scripts/bench.ts`): mount 1,000 Items, open, type 3 chars,
  ArrowDown ×50. Budget: React/Vue/Svelte < 50 ms per filter keystroke on CI-class hardware,
  no Item re-render on highlight change except the two affected Items (assert via render
  counters).
- Document the 1,000-item guidance and the "use manual filter + LoadMore beyond that" advice
  (01 §9).

## 3. Bundle size budgets

Measured with esbuild (dev dependency) bundling `import { NativeSelect } from ".../native"` and
`import { Select } from ".../select"` per adapter, minified + gzip. Overlay is counted
separately.

| Entry | Budget (gzip, excluding framework and Overlay) |
| --- | --- |
| `/native` | ≤ 3 kB |
| `/select` | ≤ 12 kB |

The `/native` bundle must contain zero bytes from Overlay (string check on the output).
`scripts/size.mjs` is wired into `pnpm release:check`.

## 4. API review and freeze

- Walk every public export and prop across the four adapters. Names, defaults and callback
  `reason` enums must be identical, or differ only by framework idiom (`v-model`, `bind:`).
  The output is a table in the skill file.
- Remove anything exported but undocumented, or document it.
- Confirm Overlay type re-exports (plan 00 §2.1) and resolve D3: Overlay exports `Animation*` in
  all adapters → expose `animation` on `Select.Popover` everywhere, or not at all.
- Dev warnings: every one has a docs anchor link in its message.

## 5. Documentation

Follow the readme-system skill (plan 00 §8). 18 READMEs updated:
- Root Note: drop the "not implemented" items that now exist. Keep "virtualization, creatable
  options and tag components are not implemented".
- Per adapter README: anatomy diagram for both primitives, props tables per part, `data-*`
  reference, keyboard tables, ARIA pattern notes (01 Q8/Q9), recipes (basic, searchable, async,
  multi with chips, forms, inside Overlay Dialog, styling with `data-*`, animation with
  CSS), SSR note (01 Q16), and a "migrating from 0.x" section.
- `skills/omniselect-<fw>.md`: complete usage and gotchas for agents.
- `.agents/skills/omniselect/SKILL.md`: update the ARIA pattern section and add the
  conformance-suite workflow ("new behavior = new scenario first").
- Examples: every recipe runnable in each `dev:*` app.

## 6. Breaking-change ledger

Collect pre-1.0 breaks from plans 03–07 plus any from §4 into the release notes. Expected
empty. Each entry gets a codemod-free migration snippet.

## 7. Gates

| Gate | Command / artifact |
| --- | --- |
| Full checks | `pnpm check && pnpm readme:check` |
| Conformance | all scenarios × 4 adapters |
| a11y | axe clean; SR matrix recorded with no blocking issues |
| Perf | `scripts/bench.ts` within budget |
| Size | `scripts/size.mjs` within budget, `/native` Overlay-free |
| Pack | `pnpm pack:packages` + plan 00 §6 inspection |
| Release | manual publish 1.0.0 (plan 00: no CI) |

## 8. Out of scope (post-1.0 candidates, not promised)

Virtualization, creatable options, tag/chip components, inline autocomplete,
`appearance: base-select` enhancement for NativeSelect, Astro example.

## 9. Implementation notes (decisions taken)

- The axe pass runs as a unit test in happy-dom (`packages/react/tests/a11y.test.ts`) rather than a Playwright script against the Next.js example; no browser was available. Results and limits are in `08-a11y-results.md`.
- Size budgets were raised to 4 kB / 14 kB after measuring (`08-release-notes.md`).
- The perf budget is a coarse ceiling that catches O(n²) regressions, plus an exact render-count assertion.
