# Accessibility audit results (1.0.0)

What was run, and what was not. Nothing below is claimed beyond what the tooling can show.

## Automated (run, passing)

`packages/react/tests/a11y.test.ts` runs `axe-core` (WCAG 2 A/AA, 2.1 A/AA, best-practice tags) on these states of the
React adapter, rendered in happy-dom:

| State | Result |
| --- | --- |
| Closed, select-only | no violations |
| Open, select-only, one item selected | no violations |
| Open, multiple | no violations |
| Combobox, filtered | no violations |
| Combobox, no matches (`Select.Empty`) | no violations (after the fix below) |
| Required, hidden control invalid (`data-invalid`, `aria-invalid`) | no violations |

Limits: happy-dom has no layout or rendering, so `color-contrast`, `target-size`, and visibility rules cannot run and are
disabled. The `region`, `landmark-one-main`, and `page-has-heading-one` rules are page-level and disabled for fragments.

**Found and fixed by this audit:** an empty list rendered `role="listbox"` containing only `role="presentation"`, which
axe reports as `aria-required-children`. `Select.Empty` now renders as a disabled option (`role="option"`,
`aria-disabled="true"`), so the listbox is never empty. The same change applies to all four adapters.

The shared conformance suite additionally pins ARIA attributes per state in all four adapters (roles, `aria-expanded`,
`aria-controls`, `aria-activedescendant`, `aria-selected`, `aria-multiselectable`, `aria-busy`, `aria-required`,
`aria-invalid`, group labelling), plus focus staying on the trigger/input for every interaction.

## Manual screen-reader matrix (not run)

These require real assistive technology on real devices and were **not performed** in this environment. Treat them as
open release gates, not as passed.

| SR | Browser | Modes to check |
| --- | --- | --- |
| VoiceOver | Safari macOS | NativeSelect, select-only, combobox, multiple, LoadMore |
| VoiceOver | Safari iOS | same |
| NVDA | Firefox, Chrome | same |
| JAWS | Chrome | select-only, combobox |
| TalkBack | Chrome Android | select-only, combobox |

For each: name/role/value announced on focus, the active option announced on arrow keys, selection state, group labels,
the "No results" option, the live-region announcements (multiple add/remove, loading/loaded), and the Clear button name.

Also still manual: a keyboard-only walkthrough of the keyboard tables in each README, and forced-colors / Windows High
Contrast (`data-highlighted` must stay visible; the library ships no CSS, so consumers need an `outline` or
`forced-color-adjust` rule).

## Known limitations

- Items register while the popover is mounted. Closed type-ahead and the selected label of an unmounted item need
  `forceMount` or `itemToString` (documented).
- Vanilla hides the popover immediately on close; there is no exit animation.
- Vue part handlers cannot be vetoed with `preventDefault` by user listeners.
