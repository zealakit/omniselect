# Plan: multi-value `Select` and native form participation

Status: **implemented**. Release target: **0.4.0** (additive).

Order: **6 of 8**. Requires `05-select-input-combobox.md` (0.3.0 shipped).

## Scope rule (read first)

Adds `multiple` to `Select` (FR-03 multi), the `Value` render function for chips (01 Q12),
multi + Input interactions, and form participation for `Select` (FR-08) through a hidden
native `<select>` (01 Q14). NativeSelect already has both (plan 03), so it is unchanged here.

**Acceptance test:** multi and form conformance scenarios pass in four adapters, and
`new FormData(form)` gives identical entries for equivalent `NativeSelect` and `Select`
configurations (a parity test).

---

## 1. Root API additions

| Prop | Type | Default |
| --- | --- | --- |
| `multiple` | `boolean` (literal discriminator, as in plan 03 §1) | `false` |
| `value` / `defaultValue` / `onValueChange` | `T[]` when `multiple` | `[]` |
| `closeOnSelect` | default flips to `false` when `multiple` (01 Q13) | |
| `name`, `form` | `string` | — |
| `maxSelected` | `number` | — (unlimited) |

`maxSelected` reached → unselected items get `data-disabled` + `aria-disabled` but stay
visible. Keyboard skips them like disabled items.

## 2. Multi behavior

- Core `selection` in `multiple` mode (plan 02 §4). The machine's select action becomes **toggle**.
- `List` gets `aria-multiselectable="true"`. Items keep `aria-selected` true/false.
- Select-only keyboard additions: Space/Enter toggle and stay open; Shift+ArrowDown/Up
  extends the selection (APG optional, included); Ctrl/Cmd+A selects all visible (only when
  `maxSelected` is unset).
- Combobox additions:
  - after a pick, the input follows `selectionBehavior`. The default for multi is
    `"clear-input"`, keeping the list open and the filter reset.
  - Backspace in an **empty** input removes the last selected value (`reason: "backspace"`
    passed to `onValueChange`'s second argument).
  - `restoreOnBlur` clears the input instead of restoring a label.

## 3. `Value` render function

- Default output: labels joined by `", "`. Placeholder when empty.
- `children: ({ items, remove, clear }) => node`, where `items` is
  `{ value: T; key: string; label: string }[]` in selection order. `remove(value)` is a stable
  callback.
- Chips are **user markup**. The docs recipe shows a chip with a remove button using
  `remove`, `tabindex="-1"` and `aria-label="Remove <label>"`, plus a note that keyboard
  removal is Backspace in combobox mode.
- A live region announcement for adds/removes ("Apple added, 3 selected") is opt-in via
  Root `announce` (default `true`, messages overridable through a `messages` prop for i18n).

## 4. Form participation (FR-08)

Core module `form` (01 §5) plus a `HiddenSelect` element rendered by Root when `name` is set.
It is not a public part.

- `<select name multiple? required? form? disabled? tabindex="-1" aria-hidden="true">` with
  one `<option selected value=key>` per selected value. It is visually hidden with a clip
  style (not `display:none` and not `hidden`), so constraint validation runs.
- **Value**: keys come from `itemToKey`. Multi gives repeated FormData entries, the same as
  NativeSelect.
- **`required`**: validity follows the hidden select. On its `invalid` event, `preventDefault`
  is **not** called (the browser bubble still shows). Focus is redirected to Trigger/Input, and
  `data-invalid` is set on Root parts until the next change.
- **Reset**: listen for `reset` on the owner form (`select.form`). Uncontrolled → restore
  `defaultValue` and `defaultInputValue`. Controlled → call `onValueChange(defaultValue)` and
  let the parent decide (same contract as plan 03 §3).
- **`disabled` fieldset**: read `hiddenSelect.matches(":disabled")` on the form's `submit`
  and `formdata` events, and expose `data-disabled` when an ancestor fieldset is disabled
  (checked on open and focus; documented as best-effort).
- Autofill: `autoComplete` is forwarded to the hidden select. Browser autofill writes trigger
  `change` there, which maps back to values by key. Keys with no registered item are ignored
  with a dev warning.

## 5. Adapters

Same parts. Typings get the `multiple` overloads (React/Vue overload signatures, Svelte generic).
Vanilla supports `multiple` with string values and renders `HiddenSelect` itself inside `rootEl`.

## 6. Tests

Conformance (`conformance/multi/*.ts`, `conformance/form/*.ts`):
- Toggle via click, Enter and Space; stays open; Shift+Arrow range; Ctrl+A.
- `maxSelected` disables the rest.
- Combobox: clear-input after a pick, Backspace removes last, blur clears input.
- `Value` render-function items order and `remove`.
- FormData: single, multi, object values; `form` attribute pointing outside.
- `required` + submit → invalid → focus on Trigger, `data-invalid` set and cleared on change.
- `form.reset()` in controlled and uncontrolled modes.
- **Parity test**: NativeSelect and Select with the same props produce identical FormData.
- Live-region messages for add and remove; `announce=false`.

## 7. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P1 | Core: multi actions, intent additions, `form` module | unit tests |
| P2 | React multi + HiddenSelect | React green |
| P3 | Vue, Svelte, Vanilla | all green |
| P4 | Parity + validity + reset tests | `pnpm check` |
| P5 | Docs ("Multi-select with chips", "Forms" recipes), skills, examples | `readme:check` |
| P6 | Pack + inspect | release 0.4.0 |

## 8. Out of scope

Built-in chip/tag components, drag-reorder of selections, schema validation (BRD non-goal).

## 9. Implementation notes (decisions taken)

- The hidden `<select>` is rendered by each adapter's Root (Vanilla appends it inside the root element, so the root must be, or sit inside, the `<form>`). Options are only the selected keys.
- `invalid` events set `data-invalid`/`aria-invalid` on the trigger/input/control and move focus there; the flag clears on the next value change.
- happy-dom's `FormData` drops every value but the first of a `<select multiple>`, so the conformance helper serializes forms by hand.
- Vue part handlers cannot be vetoed with `preventDefault` by user listeners (only React/Svelte forward the user's handler first); documented limitation.
