# Plan: `Select.LoadMore` — declarative async pagination

Status: **proposal — not implemented**. Release target: **0.5.0** (additive).

Order: **7 of 8**. Requires `06-multi-and-forms.md` (0.4.0 shipped).

## Scope rule (read first)

Adds `Select.LoadMore` (FR-05) and documents the async-search pattern built on manual filtering
from plan 05. The library never fetches. It only tells the app *when* to fetch and keeps
highlight, scroll and focus stable while items are appended.

**Acceptance test:** LoadMore conformance scenarios pass in four adapters, including "no
duplicate `onLoadMore`" under rapid intersection and "short first page keeps loading until the
list is scrollable or `hasMore` is false".

---

## 1. API

`<Select.LoadMore isLoading hasMore onLoadMore rootMargin? />`, placed as the **last child of
`Select.List`**.

| Prop | Type | Default |
| --- | --- | --- |
| `onLoadMore` | `() => void` | required |
| `hasMore` | `boolean` | required |
| `isLoading` | `boolean` | required |
| `rootMargin` | `string` | `"0px 0px 64px 0px"` (prefetch distance) |
| children | node | — (render a spinner or "Loading…"; shown by user CSS via `data-loading`) |

`data-*`: `data-loading`, `data-has-more`. Element: `div`, `aria-hidden="true"`. It is never an
option and never in the navigation order.

## 2. Core: `pagination`

State per LoadMore: `{ intersecting, inFlight, lastRequestedAt }`.

Trigger rule: call `onLoadMore` when
`open && intersecting && hasMore && !isLoading && !inFlight`.

- `inFlight` is set synchronously when `onLoadMore` is called, and cleared when `isLoading` goes
  `true → false` **or** after one microtask if the app never sets `isLoading` (sync loaders).
  This is the duplicate-request guard, independent of how fast the app flips `isLoading`.
- **Re-check after load**: IntersectionObserver does not fire again while the sentinel stays
  visible. After each `isLoading: true → false`, the adapter re-measures
  (`takeRecords()` or a rect check against the List) and runs the trigger rule again. This
  handles short pages.
- Closed popover: the observer disconnects. Reopening re-evaluates.
- Query change (manual mode): the app resets its data. LoadMore needs nothing special because
  the sentinel's intersection is re-evaluated when the list content changes (adapter re-checks
  on collection version change, debounced to one per frame).

## 3. Observer setup (adapter)

- `IntersectionObserver` with `root = List element` (the scroll container) and `rootMargin`
  from props. If the List is not the scroll container (the user's CSS scrolls the Popover),
  the adapter uses the nearest scrollable ancestor up to the Popover (computed once per open).
- SSR / no `IntersectionObserver`: LoadMore renders but never fires. Document the polyfill note.
  All evergreen targets (01 Q18) have it.

## 4. Stability guarantees

| Concern | Guarantee | Mechanism |
| --- | --- | --- |
| Highlight | Stays on the same item across appends | highlight is by key (plan 04 §2) |
| Scroll | No jump on append | items append below; library never calls `scrollIntoView` on collection change, only on keyboard highlight |
| Focus | Never moves | `aria-activedescendant` model (01 Q10); LoadMore isn't focusable |
| Keyboard at end | ArrowDown on last item while `hasMore` | stays on last, triggers the rule once even if not intersecting (keyboard users never see the sentinel), sets `aria-busy="true"` on List while `isLoading` |
| Empty during load | `Empty` hidden while any LoadMore reports `isLoading` | Root tracks the loading flag through registration |
| Announce | "Loading more results" / "N results" | the plan 06 live region with `messages` overrides, debounced |

`allowsEmptyCollection=false` (01 Q7) keeps the popover open while loading, so first-page
fetches can show a spinner.

## 5. Async search recipe (docs, not API)

Composition: `Root filter={false} inputValue onInputChange` + app-side debounced fetch +
`LoadMore` for pages. Docs show it per framework with an `AbortController`. They also note that
selected values from earlier queries keep their labels via the label cache and `itemToString`
(01 Q4). This recipe is the reference test app in each example.

## 6. Tests

Conformance (`conformance/loadmore/*.ts`). The driver provides `intersect(target)` and
`resolveLoad()` steps, backed by a controllable IntersectionObserver mock installed in each
adapter's `tests/setup.ts`:
- fires once when intersecting; not while `isLoading`; not when `!hasMore`; not when closed.
- rapid double intersection → single call.
- short page → second call after the first load resolves without new intersection events.
- highlight key unchanged after append; `scrollTop` unchanged (happy-dom: assert no
  `scrollIntoView` calls).
- ArrowDown at end triggers load; `aria-busy` toggles.
- Empty hidden during load; shows after a load returns zero items.
- Combobox manual mode: query change + reset data + paging.

## 7. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P1 | Core `pagination`, IO mock, conformance steps | unit tests |
| P2 | React LoadMore | React green |
| P3 | Vue, Svelte, Vanilla (Vanilla relies on the List MutationObserver from 01 §6.4) | all green |
| P4 | Async search recipe in each example app (mock API with latency) | manual check in `dev:*` |
| P5 | Docs, skills | `readme:check` |
| P6 | Pack + inspect | release 0.5.0 |

## 8. Out of scope

Virtualization/windowing, bidirectional (load-previous) pagination, built-in debouncing or
fetching, caching.
