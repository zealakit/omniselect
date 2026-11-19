# Plan: core foundation — state, collection, selection, navigation

Status: **proposal — not implemented**. Release target: **none** (`@zealakit/omniselect-core` is
private; it ships vendored inside the 0.1.0 adapters).

Order: **2 of 8**. Requires `00-init-src.md` (empty, buildable core package) and the decisions
in `01-architecture.md` §4–§5.

## Scope rule (read first)

Builds the framework-independent building blocks both `NativeSelect` and `Select` use. No
adapter code, no Overlay, no DOM event listeners. The only DOM API used is
`Node.compareDocumentPosition` for ordering, behind a function the caller passes in, so tests
can run without a DOM.

Nothing here is exported from the adapters' public `index.ts` except **types** that appear in
public props (`SelectionMode`, `FilterFn`, `ItemToKey`, `ItemToString`).

**Acceptance test:** `pnpm --filter @zealakit/omniselect-core test` passes with ≥ 95% line
coverage on the modules below, and the conformance driver contract (§9) type-checks against a
stub driver.

---

## 1. `store`

- `createStore<S>(initial)` → `{ get, set(partial | updater), subscribe(listener) → unsubscribe }`.
- Notifications are **batched per microtask**, plus a `batch(fn)` for synchronous grouping.
  Adapters that need synchronous reads (React `useSyncExternalStore`) call `get()`, which is
  always current.
- Shallow-equal check on `set` skips no-op notifications.
- Tests: batching, unsubscribe during notify, re-entrant `set` inside a listener.

## 2. `controllable`

- `createControllable<T>({ value?, defaultValue, onChange? })` → `{ get, set, sync(value) }`.
- Controlled when `value !== undefined` at creation. Switching between controlled and
  uncontrolled afterwards logs a dev warning (React semantics) and keeps the initial mode.
- In controlled mode `set` only calls `onChange`; the visible value changes on the next
  `sync(value)` from the adapter.
- Used three times: `value`, `open`, `inputValue`.
- Tests: both modes, `onChange` not called when value is equal by key, mode-switch warning.

## 3. `collection`

Data per item: `{ key, value, textValue, disabled, groupId, node? }`.

- `register(item) → unregister`, `update(key, patch)`.
- **Ordering**: items arrive in mount order, which is not always DOM order (conditional
  rendering, Vue/Svelte keyed lists). On the first read after a change, sort with the injected
  `compare(a, b)`. Adapters pass a `compareDocumentPosition`-based comparator; tests pass an index
  comparator. Sorting is batched per microtask.
- **Groups**: `registerGroup(id, { labelId, disabled })`. A group's `disabled` cascades to its
  items.
- **Label cache** (01 Q4): `key → textValue`, written on register/update, never cleared on
  unregister. `labelOf(key, itemToString?)`.
- **Visible subset**: `setFilter(query, filterFn | false)` yields `visible: Item[]` and
  `visibleCount`. Recomputed lazily and memoized by `(version, query)`.
- Duplicate key on register → dev warning, last one wins for lookups.
- Tests: out-of-order registration, unregister mid-sort, group cascade, label cache survives
  unmount, filter memoization.

## 4. `selection`

- `createSelection<T>({ mode: "single" | "multiple", itemToKey })`.
- Single: `T | null`. Multi: `T[]` (insertion order kept; this is the order `Value` renders).
- Operations: `select(value)`, `toggle(value)`, `remove(value)`, `clear()`, `isSelected(value)`,
  `keys()`. All compare by `itemToKey`.
- Single mode `select` of the already-selected value is a no-op (no deselect on re-click; this
  matches native `<select>`). Deselect only happens through `Clear`.
- Returns new arrays or objects; never mutates.
- Tests: key-based equality with object values, multi toggle order, clear in both modes.

## 5. `navigation`

Pure functions over `visible` items, skipping disabled ones:
`first`, `last`, `next(fromKey, { wrap })`, `prev(fromKey, { wrap })`,
`pageDown(fromKey, pageSize)`, `pageUp(fromKey, pageSize)`.

- `wrap` defaults to `false` (APG recommendation for listbox; avoids accidental jumps during
  pagination).
- `fromKey` not in visible (filtered away) → treat as "no highlight" (next = first).
- Page size is passed by the adapter (visible rows estimated from list height ÷ item height;
  fallback 10).
- Tests: all-disabled list, single item, filtered highlight, page bounds.

## 6. `typeahead`

- `createTypeahead({ timeout = 500 })` → `onKey(char, items, currentKey) → key | null`.
- Buffer accumulates within the timeout. Matching is a prefix match on normalized `textValue`,
  starting **after** the current item.
- Repeated single char (`"a","a","a"`) cycles through items starting with that char.
- Space while the buffer is non-empty is part of the query (APG). The adapter must not
  treat it as select in that case; core's intent mapper handles this (plan 04).
- Tests: timer via injected clock, cycling, diacritics.

## 7. `filter`

- `normalize(s)`: NFD → strip `\p{M}` → `toLocaleLowerCase()` → trim.
- `defaultFilter(item, query)`: `normalize(item.textValue).includes(normalize(query))`;
  empty query matches all.
- `FilterFn<T>` type: `(item: { value: T; textValue: string }, query: string) => boolean`.
- Tests: Vietnamese and CJK samples (the docs ship in VI and CN), empty query, whitespace.

## 8. `ids`

- `createIds(rootId)` → `{ label, trigger, input, listbox, item(key), group(id), groupLabel(id) }`.
- Item ids encode the key safely (`encodeURIComponent`, then `%` → `_`), so object keys and
  spaces are valid in `aria-activedescendant`.
- Vanilla fallback counter: `getGlobalState("ids")` → `omniselect-<n>` (plan 00 §2.2).

## 9. Conformance driver contract

Defined here, filled with scenarios by plans 03–07.

- `Scenario`: `{ name, primitive: "native" | "select", props, tree: PartNode[], steps: Step[] }`
  where `tree` describes which optional parts are mounted (for example Input present or absent)
  and their item lists.
- `Step`: `press(key, mods?)`, `type(text)`, `click(target)`, `focus(target)`, `setProps(p)`,
  `intersect(target)`, `resolveLoad()`, `submitForm()`, `resetForm()`, `expect(snapshot)`.
- `Snapshot`: per-part ARIA attributes, `data-*` attributes, `document.activeElement` part,
  callback call log, and `FormData` entries.
- `Driver` (one per adapter): `mount(scenario) → { query(target), act(step), unmount }`.
- Runner: `runConformance(driver, scenarios)` produces `node:test` cases.
- Target references are part names plus item keys (`"trigger"`, `"item:apple"`), never CSS
  selectors. That keeps scenarios independent of each adapter's markup.

## 10. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P1 | `store`, `controllable` | unit tests |
| P2 | `collection`, `filter`, `ids` | unit tests |
| P3 | `selection`, `navigation`, `typeahead` | unit tests |
| P4 | Conformance types + runner + stub driver | typecheck + one passing stub scenario |
| P5 | Coverage + `pnpm check` | ≥ 95% lines, Biome clean |

## 11. Out of scope

- The `select-machine` orchestrator and keyboard intent mapping (plan 04).
- `pagination` (plan 07) and `form` (plan 06).
- Any adapter work.
