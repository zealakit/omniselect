# Plan: `Select` — single selection, select-only combobox, popover

Status: **proposal — not implemented**. Release target: **0.2.0**.

Order: **4 of 8**. Requires `02-core-foundation.md`, `03-native-select.md` (0.1.0 shipped), and
Overlay 1.x installed per `00-init-src.md` §2.1.

## Scope rule (read first)

Delivers the custom `Select` with **single** selection, **without** `Input`. Parts: `Root`,
`Label`, `Control`, `Trigger`, `Value`, `Clear`, `Indicator`, `Popover`, `List`, `Group`,
`GroupLabel`, `Item`, `ItemIndicator`, `Empty`. Covers FR-01, FR-02 (select-only half),
FR-03 (single), FR-06 and FR-07.

`Input` is plan 05, multi + forms is plan 06, `LoadMore` is plan 07. Parts for those are not
exported yet (no speculative APIs, plan 00 hard rule). Root props they need are not exported
either.

**Acceptance test:** Select conformance scenarios (§8) pass in all four adapters; nested-in-Overlay-
Dialog test passes; `Select` is importable from `/select` and the root entry.

---

## 1. Root API (0.2.0)

| Prop | Type | Default |
| --- | --- | --- |
| `value` / `defaultValue` / `onValueChange` | `T \| null` | `null` |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` | `false` |
| `itemToKey`, `itemToString` | see 01 Q3 | `String` |
| `disabled`, `required` | `boolean` | `false` |
| `closeOnSelect` | `boolean` | `true` |
| `allowsEmptyCollection` | `boolean` | `true` |
| `loop` | `boolean` | `false` (navigation wrap) |
| `placement`, `offset`, `matchWidth` | Overlay types | `"bottom-start"`, `4`, `true` |

`name` and form participation come in plan 06. Until then, the README points to NativeSelect
for forms.

## 2. Core: `select-machine`

New core module. It composes plan 02's pieces into one store:

State: `{ open, highlightedKey, value, mode: "select-only" | "combobox", focusOrigin }`.

Actions: `open(reason, highlight: "selected" | "first" | "last")`, `close(reason)`,
`highlight(key, source: "keyboard" | "pointer")`, `selectHighlighted()`, `select(value)`,
`clear()`.

Rules:
- Opening highlights the selected item if visible, otherwise first or last depending on the key.
- Closing clears the highlight. Focus returns to Trigger (the adapter does this via Overlay focus
  helpers) only when the close reason is `select`, `escape` or `tab`. Never on outside click,
  so focus doesn't jump away from what the user clicked.
- `highlightedKey` is a **key**, never an index. This is the base of plan 07's stability.
- Pointer highlight: `pointermove` (not `mouseenter`) to avoid highlight jumps while the list
  scrolls under a still cursor. Ignored for `pointerType === "touch"`.

### 2.1 Keyboard intent map (select-only mode)

| Key | Closed | Open |
| --- | --- | --- |
| ArrowDown / ArrowUp | open, highlight selected or first/last | next / prev |
| Alt+ArrowDown | open, no highlight move | — |
| Alt+ArrowUp | — | select highlighted, close |
| Home / End | open, first / last | first / last |
| PageUp / PageDown | — | ±page |
| Enter / Space | open | select highlighted (Space only when typeahead buffer empty) |
| Escape | — (Overlay layer stack handles open case) | close, keep value |
| Tab | — | select highlighted (APG), close, let focus move |
| Printable char | typeahead → **select** match without opening (native behavior) | typeahead → highlight |

Output is `Action[]` plus `{ preventDefault: boolean }`. Adapters apply it.

## 3. ARIA wiring (select-only, 01 Q8)

| Part | Attributes |
| --- | --- |
| Trigger | `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (listbox id, only while mounted), `aria-activedescendant` (only while open and highlighted), `aria-labelledby="<label> <trigger>"`, `aria-required`, `aria-disabled` / `disabled` |
| List | `role="listbox"`, `id`, `aria-labelledby=<label>`, `tabindex="-1"` |
| Group | `role="group"`, `aria-labelledby=<groupLabel>` |
| Item | `role="option"`, `id`, `aria-selected`, `aria-disabled` |
| Value | rendered inside Trigger, so its text is the combobox's accessible value |
| Clear | `aria-label` from `label` prop (default "Clear selection"), `tabindex="-1"` by default (keyboard users clear with Backspace/Delete on Trigger, which the intent map adds), `hidden` when nothing to clear |
| Empty | text node inside List with `role="presentation"`. Also announced through a polite live region owned by Root (one per page, via core global state) |

`aria-*` maps come from core `aria` functions (plan 02 §5) so adapters never hand-write them.

## 4. Popover (FR-06) — via Overlay

- Anchor = `Control` if mounted, else `Trigger`.
- Overlay `usePositioner` (React/Vue), `floating` action (Svelte), `createFloating` (Vanilla) with
  `flip` + `shift`. `matchWidth` sets `--omniselect-anchor-width` on Popover. Available-height
  is exposed as `--omniselect-available-height` so users can cap List height in CSS.
- Overlay `useLayer`/`layer` registers the popover in the **shared layer stack**. Escape and
  outside-click come from it. The outside-click boundary includes the Control so clicking the
  Trigger toggles instead of closing and reopening.
- Portal: Overlay `Portal` by default. Root `portal={false}` renders in place.
- **Presence**: Popover stays mounted until exit animations finish.
  - **P0 verification**: confirm whether Overlay 1.x presence waits for CSS
    `animation`/`transition` on its own (not only its WAAPI presets).
  - If yes, use it with `animation` off and CSS-driven exits.
  - If no, add core `waitForExit(el)`: `el.getAnimations()` → `Promise.all(finished)`, with a
    fallback to `animationend`/`transitionend` and a 1 s safety timeout. Adapters keep the node
    with `data-state="closed"` until it resolves. `prefers-reduced-motion` is left to user CSS.
- `data-state="open|closed"` and `data-side`/`data-align` (from Overlay placement) on Popover.
- `forceMount` prop on Popover keeps it in the DOM when closed (hidden), for users who
  want items always registered.

## 5. Item and indicator behavior

- Item props: `value: T`, `disabled`, `textValue?` (defaults to trimmed text content, read in a
  layout effect), children.
- Item `data-*`: `data-highlighted`, `data-selected`, `data-disabled`, `data-state="checked|unchecked"`.
- Click selects. `pointerup` is used for selection only when the open came from a `pointerdown`
  on Trigger followed by a drag (native "press-drag-release" behavior). Otherwise it's `click`.
- Highlighted item scrolls into view with `block: "nearest"`, **only** when the highlight source
  is keyboard.
- `ItemIndicator` renders children only when its Item is selected. `forceMount` + `data-state` for
  animated checkmarks.

## 6. Value, Clear, Indicator, Empty

- `Value` props: `placeholder`, children render function `(value, label) => node`. Sets
  `data-placeholder` when empty. Label from the label cache (01 Q4).
- `Clear` calls `machine.clear()` and returns focus to Trigger. In 0.3.0 it also clears input
  (plan 05).
- `Indicator`: `aria-hidden`, `data-state` follows open.
- `Empty` renders only when `visibleCount === 0` and `allowsEmptyCollection`. With no Input in
  0.2.0 this means "no items at all".

## 7. Adapters

- React: the parts listed in Scope, `"use client"` banner kept (plan 00). Selector-based
  subscriptions: each Item subscribes only to `isHighlighted(key)` and `isSelected(key)`.
- Vue: same parts as render-function components. `v-model`, `v-model:open`.
- Svelte: same parts. `bind:value`, `bind:open`.
- Vanilla: `createSelect(rootEl, options)` (01 §6.4). Popover element moved to the portal
  container on open, restored on destroy.

## 8. Tests

Conformance scenarios (`conformance/select/*.ts`):
- ARIA snapshot closed/open, with and without Label.
- Every row of the keyboard table §2.1, including typeahead-select while closed.
- Disabled items and groups skipped. `loop` on and off.
- Controlled `value` and `open`. `onOpenChange` reasons.
- Clear: hidden when empty, resets value, focus back to Trigger.
- Empty rendering, `allowsEmptyCollection=false` blocks opening.
- Object values with `itemToKey` + label cache when Popover unmounted.

Adapter-only tests:
- Popover in Overlay Dialog: Escape closes Select only; clicking inside Select is not outside for
  the Dialog (plan 00 §2.1).
- Presence: Popover stays mounted while a mocked `getAnimations()` promise is pending.
- Structural dev warnings (01 §3) fire for Clear inside Trigger.
- SSR render to string: closed Select, no Popover markup, no DOM access at import or render.

## 9. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P0 | Verify Overlay presence + type exports (plan 00 D3) | decision recorded in this file |
| P1 | Core `select-machine`, intent map, `aria` maps | core unit tests |
| P2 | React parts + driver | React conformance green |
| P3 | Vue, Svelte, Vanilla | all green |
| P4 | Nesting, presence, SSR tests | `pnpm check` |
| P5 | Docs (anatomy, props, data-attrs, keyboard table), skills, examples ("Select in Dialog" demo per plan 00 §9) | `readme:check` |
| P6 | Pack + inspect | release 0.2.0 |

## 10. Out of scope

`Input`/filtering (05), `multiple` and `name` (06), `LoadMore` (07).
