# Plan: Omniselect architecture — BRD alignment, decisions, and phase map

Status: **proposal — not implemented**. Release target: **none** (decisions only; no code).

Order: **1 of 8**. Runs after `00-init-src.md`. Every later plan (`02-…` to `08-…`) builds on
the decisions recorded here. If a later plan disagrees with this one, this one wins until
it is amended.

## Scope rule (read first)

This plan reconciles the **OmniSelect BRD** with `00-init-src.md`, settles the questions the
BRD leaves open, and fixes the public shape (exports, parts, ARIA patterns, core modules)
so the component plans can be implemented without re-deciding them.

It contains **no code**. Type and prop names below are API contracts. The implementation
plans may refine them, but only by amending this file.

---

## 1. Decisions taken (signed off)

| # | Decision | Outcome |
| --- | --- | --- |
| A1 | Positioning source | **Keep Overlay** (plan 00 §2.1). `@zealakit/overlay-<fw>` provides floating behavior, layers, dismissal, portal and focus helpers |
| A2 | v1 scope | **Full BRD scope, phased**: NativeSelect → Select (single) → Input/combobox → multi + forms → LoadMore |

### 1.1 BRD amendments that follow from A1/A2

- **Zero runtime dependencies (BRD §5)** is reworded to: *"`@zealakit/omniselect-core` has zero
  runtime dependencies. Adapters depend only on their framework peer and on the matching
  first-party `@zealakit/overlay-<fw>`. No other third-party runtime packages. `@floating-ui/dom`
  reaches users only transitively through Overlay."*
- **Plan 00 D1 is superseded.** v1 includes `NativeSelect`, `Select.Input` (combobox mode), multi
  selection and `Select.LoadMore`. Still out of scope: virtualization, creatable options, and
  built-in tag/chip components (chips are user markup; see plan 06).
- **There is no separate `Combobox` export.** Combobox is `Select` with `Select.Input` mounted
  (BRD FR-02). Plan 00's wording "Select and Combobox primitives" is kept in package
  descriptions, because that is how users search for it.

## 2. Package and export layout

Plan 00's packages are unchanged: private `core` plus four adapters. Each adapter gains
**subpath exports** so the BRD's tree-shaking requirement holds even without a bundler:

| Subpath | Exports | Pulls in Overlay? |
| --- | --- | --- |
| `@zealakit/omniselect-<fw>/native` | `NativeSelect` | **No** |
| `@zealakit/omniselect-<fw>/select` | `Select` | Yes |
| `@zealakit/omniselect-<fw>` | re-exports both + shared types | Yes (bundlers drop it if unused) |

Rules:
- `sideEffects: false` (Svelte: `["**/*.svelte"]`) as in plan 00.
- NativeSelect source files must not import any `select/` module or any Overlay module.
  A test asserts this by walking the import graph of `dist/native/index.js` (plan 03 §6).
- The compound namespace is built with `export * as Select from "./select/parts.js"` (and the
  same for `NativeSelect`). Modern bundlers tree-shake ES namespace re-exports. Do **not**
  build it as `const Select = { Root, … }`, because an object literal blocks per-part shaking.
- Vanilla has no components, so it exports factories instead (§6.4).

## 3. Part anatomy (final)

### 3.1 NativeSelect

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | none (context only) | owns value, `name`, `disabled`, `required`, `multiple` |
| `Label` | `label` | `htmlFor` → Control id |
| `Control` | `select` | the only focusable element |
| `Option` | `option` | `value: T`, `disabled`, `textValue?` |
| `OptionGroup` | `optgroup` | `label`, `disabled` |
| `Indicator` | `span` | `aria-hidden="true"`, decorative |

### 3.2 Select

| Part | Element | Required? | Role/ARIA owner |
| --- | --- | --- | --- |
| `Root` | none (context) | yes | state, ids, mode detection |
| `Label` | `label`/`span` | no | `id` used by `aria-labelledby` |
| `Control` | `div` | no | positioning anchor + outside-click boundary |
| `Trigger` | `button` | yes* | `combobox` (select-only) **or** plain button (combobox mode) |
| `Input` | `input` | no | `combobox` when mounted |
| `Value` | `span` | no | selected label(s) / placeholder |
| `Clear` | `button` | no | never nested inside `Trigger` |
| `Indicator` | `span` | no | `aria-hidden`, `data-state` |
| `Popover` | `div` (portaled) | yes | positioning surface, presence |
| `List` | `div` | yes | `listbox` |
| `Group` / `GroupLabel` | `div` / `div` | no | `group` + `aria-labelledby` |
| `Item` | `div` | yes | `option` |
| `ItemIndicator` | `span` | no | `aria-hidden`, renders only when parent selected |
| `Empty` | `div` | no | `role="presentation"`, live text |
| `LoadMore` | `div` | no | sentinel, `aria-hidden` |

\* `Trigger` may be omitted only in combobox mode (the Input opens the list on typing/ArrowDown).

Structural rules (validated in dev builds with a console warning, stripped in production via
`process.env.NODE_ENV` guard that is SSR- and bundler-safe):
- `Clear` and `Indicator` must not be descendants of `Trigger` (nested interactive content).
- `Item`, `Group`, `Empty` and `LoadMore` must be inside `List`.
- Only one `Input` per `Root`.

## 4. Questions the BRD left open — resolved

| # | Question | Resolution |
| --- | --- | --- |
| Q1 | First adapter | **React is the reference implementation** in every phase. Vue, Svelte, Vanilla follow inside the same phase. A phase is not released until all four pass the shared conformance suite (§7) |
| Q2 | Collection source | **Registration by mounted parts**: `Item` registers `{ key, value, textValue, disabled, groupId }` with the Root. Order = DOM order (`compareDocumentPosition`), recomputed in batches. No `items` prop in v1 |
| Q3 | Object values | Root takes `itemToKey(value) => string` (default `String(value)`, dev warning if two distinct objects map to the same key) and `itemToString(value) => string` (fallback label when the Item is not mounted, and SSR). Keys are what forms submit |
| Q4 | Labels when the list is unmounted | Root keeps a **label cache** `key → textValue`, filled on registration and never cleared on unmount. `Value` reads `cache → itemToString → key` in that order |
| Q5 | Filtering owner | Root `filter` prop: default = case/diacritic-insensitive *contains* on `textValue`; custom `(item, query) => boolean`; `filter={false}` = manual mode (app filters or fetches; all registered items visible) |
| Q6 | Filtered-out Items | Stay mounted and registered, render nothing. Navigation, `Empty` and `aria-setsize` use the **visible** subset |
| Q7 | `allowsEmptyCollection` | Root prop, default `true`. When `false`, the popover does not open (and closes) while the visible collection is empty and no `LoadMore` is loading. `Empty` only renders when `true` |
| Q8 | Select-only ARIA pattern (FR-02) | **WAI-ARIA APG select-only combobox**: `role="combobox"` on `Trigger`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`. Not the legacy listbox-button pattern |
| Q9 | Combobox ARIA pattern | **APG editable combobox with list autocomplete**: `role="combobox"` on `Input`, `aria-autocomplete="list"`; `Trigger` becomes `tabindex="-1"`, `aria-label` from `triggerLabel` (default "Show options") |
| Q10 | Focus model (FR-07) | **`aria-activedescendant` only.** DOM focus stays on Trigger or Input; the list never receives focus. This is what keeps typing and pagination from stealing focus |
| Q11 | Type-ahead vs typing | Type-ahead runs only in select-only mode. In combobox mode, printable keys go to the Input |
| Q12 | Multi display | `Value` renders labels joined by `", "` by default, or a render function `({ items, remove }) => …` for chips. No chip component ships |
| Q13 | Close on select | Default `true` for single, `false` for multi; `closeOnSelect` prop overrides |
| Q14 | Select form participation | Root renders a **visually hidden native `<select>`** (`multiple` when multi, `tabindex="-1"`, `aria-hidden="true"`) when `name` is set. Handles FormData with repeated names, `required` validity, and `form.reset()` (plan 06) |
| Q15 | Hydration-safe ids | Adapters use the framework's id primitive (`useId`, Vue `useId`, Svelte `$props.id()`); Vanilla uses the core id counter (global state, plan 00 §2.2) |
| Q16 | Mode detection on SSR | Server HTML renders select-only semantics; `Input` registration switches to combobox semantics in the first layout effect. Documented; covered by a hydration test (plan 05) |
| Q17 | RTL | Overlay placement handles logical sides; Home/End/arrow semantics are vertical and unaffected. `dir` is read from the Control |
| Q18 | Browser support | Evergreen browsers (last 2 versions of Chrome, Edge, Firefox, Safari), iOS Safari 16.4+. Same as Overlay |

## 5. Core modules (`@zealakit/omniselect-core`)

Pure TypeScript, no DOM-framework or Overlay imports. Every module is a plain function
or a small store, unit-tested without a framework.

| Module | Responsibility | Plan |
| --- | --- | --- |
| `store` | Minimal observable store (`get`, `set`, `subscribe`, batched notify). Base for all state | 02 |
| `controllable` | Controlled/uncontrolled value helper (`value`/`defaultValue`/`onChange`) used for value, open and inputValue | 02 |
| `collection` | Item registry, DOM-order sort, groups, label cache, visible subset | 02 |
| `selection` | Single (`T \| null`) and multi (`T[]`) models keyed by `itemToKey`; toggle/replace/clear | 02 |
| `navigation` | Next/prev/first/last/page over visible, enabled items; wrap option | 02 |
| `typeahead` | Buffered prefix search with timeout (500 ms), repeat-char cycling | 02 |
| `filter` | Default normalizing contains-filter (NFD, strip combining marks, lowercase) | 02 |
| `aria` | Pure functions returning attribute maps per part and mode | 02 / 04 / 05 |
| `ids` | Id derivation from a root id (`<root>-trigger`, `-listbox`, `-item-<key>`) | 02 |
| `select-machine` | Orchestrates the above: open/close, highlight, select, keyboard intent → actions | 04 |
| `pagination` | LoadMore guard state (in-flight, re-arm, still-visible re-check) | 07 |
| `form` | Value ↔ string serialization for hidden native select; reset handling contract | 06 |

Keyboard handling lives in core as **intent mapping**: `(event-like, mode, state) → Action[]`.
Adapters forward the key event and apply `preventDefault` when core says so. This keeps the four
adapters behaviorally identical.

## 6. Adapter shape

### 6.1 React
Parts are `forwardRef` components (React 19 accepts `ref` as a prop; both are supported via the
peer range). Root creates the core machine once (`useState(() => …)`) and syncs controlled props
in a layout effect. Parts subscribe via `useSyncExternalStore` with selectors to avoid
re-rendering every Item on highlight change. Prop merging lets users pass their own handlers;
calling `event.preventDefault()` in a user handler skips the internal one.

### 6.2 Vue
Render-function components in `.ts` (plan 00). `provide`/`inject` for context, `shallowRef` mirror of
the core store. `v-model` / `v-model:inputValue` / `v-model:open` map to the controllable helpers.

### 6.3 Svelte
`.svelte` files in `src/parts/`, Svelte 5 runes. Context via `setContext`. Bindable `value`,
`inputValue`, `open`.

### 6.4 Vanilla
`createNativeSelect(rootEl, options)` and `createSelect(rootEl, options)`. Parts are found by
`data-part="trigger|input|value|…"` inside `rootEl`, with Items as `data-part="item"` plus
`data-value`. A `MutationObserver` on the List picks up appended or removed Items (needed for
LoadMore). Returns a handle with `getValue`, `setValue`, `open`, `close`, `refresh`, `destroy`.
Object values are not supported in Vanilla (`data-value` is a string). This is documented.

## 7. Shared conformance suite

`packages/core/tests/conformance/` holds framework-neutral **scenario specs** (data: initial
markup description, steps such as `press ArrowDown` / `type "ap"` / `click item:apple`, and
expected ARIA/`data-*`/value snapshots). Each adapter has a small driver that mounts its parts
for a scenario and runs the steps in happy-dom. Same scenarios × 4 adapters is what "adapters
stay aligned" means in practice.

Scenario files are added by each phase plan. The driver contract is defined in plan 02.

## 8. Phase map

| Plan | Delivers | Release |
| --- | --- | --- |
| `02-core-foundation.md` | store, controllable, collection, selection, navigation, typeahead, filter, ids, conformance driver contract | none (private) |
| `03-native-select.md` | `NativeSelect` in 4 adapters, single + multi, forms | **0.1.0** |
| `04-select-listbox.md` | `Select` single, select-only combobox, Popover via Overlay, keyboard, groups, ItemIndicator, Clear, Empty | **0.2.0** |
| `05-select-input-combobox.md` | `Select.Input`, ARIA mode switch, filtering, controlled `inputValue` | **0.3.0** |
| `06-multi-and-forms.md` | multi-value Select, `Value` render function, hidden native select, reset/validity | **0.4.0** |
| `07-async-loadmore.md` | `Select.LoadMore`, manual filtering + async query pattern, highlight/scroll stability | **0.5.0** |
| `08-hardening-docs-release.md` | a11y audit, screen-reader matrix, size budgets, READMEs/skills/examples complete | **1.0.0** |

Pre-1.0 releases may change APIs; each plan lists its breaking changes, if any.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Overlay 1.0.0 type gaps (plan 00 D3) block `animation` typing in Vue/Svelte/Vanilla | Ship presence/animation only after Overlay exports `Animation*` everywhere. Until then, exit presence uses Overlay's lifecycle without an `animation` prop (plan 04 §4) |
| Overlay's presence may not wait for **CSS** exit animations (BRD FR-06) | Plan 04 P0 verifies this. If it doesn't, core adds a 30-line `waitForExit(el)` (`getAnimations()` + `animationend`/`transitionend` fallback) |
| Registration-based collection is O(n) per mount in large lists | Batch sorting per microtask. Virtualization is out of scope; budget documented at 1,000 items (plan 08 perf test) |
| Mode flip after hydration (Q16) causes a brief attribute change | Accepted. No visual change, covered by a test |
| Four adapters × seven phases is slow | React-first per phase. Conformance suite catches drift; no phase releases partially |
