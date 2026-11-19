# Plan: `Select.Input` — combobox mode and filtering

Status: **implemented**. Release target: **0.3.0** (additive).

Order: **5 of 8**. Requires `04-select-listbox.md` (0.2.0 shipped).

## Scope rule (read first)

Adds `Select.Input` and the Root props for search text. Mounting `Input` switches the Root to
the APG editable-combobox pattern (01 Q9). Removing it switches back. Covers FR-02 (combobox
half), FR-04, and FR-07 for typing.

Single selection only. Multi + combobox interaction (Backspace removes last value, input
reset per pick) is plan 06.

**Acceptance test:** combobox conformance scenarios pass in four adapters; the mode-switch
hydration test passes; 0.2.0 select-only scenarios still pass unchanged.

---

## 1. New Root props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `inputValue` / `defaultInputValue` / `onInputChange` | `string` | `""` | `onInputChange(value, reason)`; reason ∈ `input`, `select`, `clear`, `close`, `reset` |
| `filter` | `FilterFn<T> \| false` | `defaultFilter` | `false` = manual: every registered item is visible (01 Q5) |
| `openOnFocus` | `boolean` | `false` | |
| `openOnInput` | `boolean` | `true` | |
| `selectionBehavior` | `"replace-input" \| "keep-input" \| "clear-input"` | `"replace-input"` | what the input shows after a pick (single) |
| `restoreOnBlur` | `boolean` | `true` | on blur without a pick, input reverts to the selected label |
| `triggerLabel` | `string` | `"Show options"` | Trigger's `aria-label` in combobox mode |

## 2. Mode detection

- `Input` registers with the Root on mount (layout effect, or `onMount` in Svelte and Vue's
  `onMounted`) and unregisters on unmount. `machine.mode` follows.
- In combobox mode:
  - `Input` takes `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`,
    `aria-controls`, `aria-activedescendant`, `aria-labelledby=<label>`, `autocomplete="off"`,
    `spellcheck="false"`.
  - `Trigger` drops `role="combobox"` and `aria-activedescendant`. It gets `tabindex="-1"`,
    `aria-label=triggerLabel`, `aria-expanded`, `aria-controls`. Clicking it toggles and focuses
    the Input.
  - `Value` is still allowed (for example, multi chips in plan 06). In single mode, docs
    recommend omitting it because the Input shows the label.
- SSR (01 Q16): the server output is select-only. The switch happens in the first client
  layout effect. Test: hydrate a server string with Input present; no hydration mismatch
  warnings, and ARIA ends in combobox mode after one tick.

## 3. Filtering

- Core `collection.setFilter(inputValue, filter)` runs whenever `inputValue` changes **while
  open**, or when it opens. When closed, all items are visible (so typeahead, labels and counts
  stay correct).
- After the query changes, the highlight moves to the **first visible** item if the current
  one is filtered out. Otherwise it stays. Opt-out: `autoHighlight={false}` leaves nothing
  highlighted until arrow keys are used.
- Filtered-out Items render nothing but stay registered (01 Q6). `Group` hides itself when all
  of its items are filtered out (`data-empty` + no render).
- `Empty` now means "no visible items for this query".
- Manual mode (`filter={false}`) is how apps do server-side search. Plan 07 documents the async
  pattern with `LoadMore`.

## 4. Keyboard intent map (combobox mode)

| Key | Closed | Open |
| --- | --- | --- |
| Printable / Backspace / Delete | edit text; `openOnInput` opens | edit text; filter |
| ArrowDown / ArrowUp | open, highlight first / last | next / prev |
| Alt+ArrowDown | open, no highlight | — |
| Enter | — (form submit allowed to proceed) | select highlighted; `preventDefault` only if something was selected |
| Escape | if input non-empty: clear input (`reason: "clear"`) | close (layer stack) |
| Home / End | native caret movement | native caret movement (APG: do not hijack in editable combobox) |
| Tab | normal | close; select highlighted **only** if `autoSelectOnTab` (default `false`) |
| Space | inserts space | inserts space (never selects in combobox mode) |

Type-ahead is disabled in this mode (01 Q11).

IME composition: ignore keys while `event.isComposing` (or `keyCode === 229`), and filter
on `compositionend`. Required for VI/CN users. Tested with synthetic composition events.

## 5. Focus

- DOM focus stays on Input for the whole interaction (01 Q10). Item `pointerdown` does
  `preventDefault` so clicks do not blur the Input.
- `Clear` in combobox mode clears value and input, then focuses Input.
- Blur closes (`reason: "blur"`) unless focus moved into the Popover (for example, a custom
  interactive footer); in that case the layer stack's outside-interaction rules decide.

## 6. Adapters

- React: `Input` is a controlled `<input>` fed from the store. The caret position is preserved
  across external `inputValue` updates by comparing before writing the DOM value.
- Vue: `v-model:inputValue`.
- Svelte: `bind:inputValue`.
- Vanilla: `data-part="input"` discovered at `createSelect` time and on `refresh()`. Mode switches
  if it is added or removed later.

## 7. Tests

Conformance (`conformance/combobox/*.ts`):
- ARIA snapshot both modes, and the switch when Input mounts or unmounts at runtime.
- Typing filters; highlight moves to first visible; `autoHighlight=false`.
- Every row of §4. Enter submits the form when nothing is highlighted.
- `selectionBehavior` variants; `restoreOnBlur`.
- Controlled `inputValue` with `onInputChange` reasons.
- Manual filter mode: all items visible regardless of query.
- Group hides when empty; Empty shows for zero matches.
- Diacritic-insensitive match ("viet" matches "Việt").

Adapter-only: hydration mode switch, IME composition, caret preservation (React).

## 8. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P1 | Core: mode, combobox intent map, filter wiring, aria maps | unit tests |
| P2 | React `Input` + driver updates | React green |
| P3 | Vue, Svelte, Vanilla | all green |
| P4 | Hydration, IME tests; 0.2.0 regression | `pnpm check` |
| P5 | Docs ("Searchable select" recipe), skills, examples | `readme:check` |
| P6 | Pack + inspect | release 0.3.0 |

## 9. Out of scope

Inline autocomplete (`aria-autocomplete="both"`, completing the text in the field), creatable
options, multi interactions (06), async fetching (07).

## 10. Implementation notes (decisions taken)

- `filterQuery` (the text the filter runs on) is separate from `inputValue`: opening with the selected label showing does not filter the list down to that one item.
- Filtered-out items stay registered; React/Vue/Svelte render `null` for them and refresh the DOM-order `node` when they return. Svelte shows an item until its first registration, because the filter does not know it yet.
- `Item` text falls back to the text of its children when the element is not mounted (React/Vue), so an item that starts filtered out still has a label.
- The popover and items prevent `mousedown`/`pointerdown` so focus stays on the input.
- Multiple + combobox behavior (clear-input after a pick, Backspace removes the last value) already lives in the core machine; plan 06 exposes `multiple` in the adapters.
