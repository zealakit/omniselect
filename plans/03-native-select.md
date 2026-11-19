# Plan: `NativeSelect` — semantic `<select>` primitive

Status: **proposal — not implemented**. Release target: **0.1.0** (first publishable version).

Order: **3 of 8**. Requires `02-core-foundation.md` (store, controllable, collection, selection,
ids, conformance contract).

## Scope rule (read first)

Implements BRD §3 "Export 1" in all four adapters, behind the `/native` subpath
(`01-architecture.md` §2). It covers FR-01, FR-03 and FR-08 for the native primitive.

It must **not** import Overlay or any `select/` module. That is the BRD tree-shaking
requirement, and it is enforced by a test (§6).

**Acceptance test:** NativeSelect conformance scenarios pass in React, Vue, Svelte and Vanilla;
`dist/native/index.js` has no transitive import of `@zealakit/overlay-*` or `select/`; tarballs
pack per plan 00 §6.

---

## 1. Public API

### Root

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `T \| null` / `T[]` | — | controlled |
| `defaultValue` | same | `null` / `[]` | uncontrolled |
| `onValueChange` | `(value) => void` | — | |
| `multiple` | `boolean` | `false` | switches value type (typed overloads in TS) |
| `itemToKey` | `(v: T) => string` | `String` | becomes `<option value>` |
| `name`, `form`, `required`, `disabled`, `autoComplete` | native | — | forwarded to Control |

`multiple` is a **literal type discriminator**, so `onValueChange` is typed as `T | null` or
`T[]` accordingly (overloaded component signatures in React and Vue, a generic `Multiple
extends boolean` in Svelte).

### Parts

`Label`, `Control`, `Option` (`value: T`, `disabled`, `textValue?`, children),
`OptionGroup` (`label`, `disabled`), `Indicator`. All forward refs and spread remaining props.

### `data-*` attributes

| Part | Attributes |
| --- | --- |
| Root wrapper-less → set on Control, Label, Indicator | `data-disabled`, `data-required`, `data-invalid` (after the `invalid` event, cleared on change), `data-placeholder` (single, value `null`) |
| Option | `data-disabled` |

## 2. Value ↔ DOM sync

- Option registers `{ key: itemToKey(value), value, textValue, disabled }` with the collection
  from plan 02. `textValue` defaults to the option's text content.
- **Uncontrolled**: the browser owns the selected state. On `change`, read
  `selectedOptions` → keys → values via the collection → `selection` → `onValueChange`.
- **Controlled**: after every value sync, set `option.selected` for each option (multi) or
  `select.value = key` (single). If the user changes it and the parent does not update,
  revert on the next microtask, matching React's controlled-input behavior.
- **Placeholder** (single, `null` value): users render
  `<Option value={null} disabled hidden>`. `itemToKey(null)` is special-cased to `""`.
  Documented pattern; no placeholder prop.

## 3. Forms (FR-08)

- Native behavior covers FormData, `required` and `form` attributes.
- `form.reset()` for an uncontrolled Root: the browser resets the `<select>` to the options'
  `defaultSelected`. The adapter sets `defaultSelected` from `defaultValue` so reset lands on it,
  then emits `onValueChange` from a `reset` listener on the owner form.
- For a controlled Root, `reset` calls `onValueChange(defaultValue ?? null/[])`. The parent decides.

## 4. Label and Indicator

- `Label` gets `htmlFor = ids.trigger` (reusing the Control id slot). If the user renders the
  Control inside the Label, `htmlFor` is omitted.
- `Indicator` is `aria-hidden="true"`, has no behavior, and carries `data-disabled`. It is a
  slot for a chevron icon.

## 5. Adapter notes

| Adapter | Notes |
| --- | --- |
| React | Use `onChange`. Never set `value` and `defaultValue` together on `<select>`. In controlled mode set `value`/`multiple`; uncontrolled uses refs + `defaultSelected` |
| Vue | `v-model` support (`modelValue` / `update:modelValue`). Options rendered via slots |
| Svelte | `bind:value`; generic `T`; `.svelte` parts in `src/parts/native/` |
| Vanilla | `createNativeSelect(rootEl, { itemToKey?, onValueChange? })` enhances existing markup; options read from DOM. `value` is string-typed (01 §6.4). Returns `{ getValue, setValue, destroy }` |

## 6. Tests

- **Conformance scenarios** (`packages/core/tests/conformance/native/*.ts`):
  single uncontrolled, single controlled + revert, multi controlled, object values with
  `itemToKey`, disabled option and group, required + `invalid` → `data-invalid`, FormData
  entries (single and repeated multi), `form.reset()` in both modes, placeholder `null`.
- **Import-graph test** per adapter: resolve `dist/native/index.js` recursively, fail if any
  specifier matches `@zealakit/overlay` or `/select/`.
- **SSR test**: render NativeSelect to string (React `renderToString`, Vue `renderToString`,
  Svelte `render`) with no DOM globals; output contains `selected` on the default option.
- Type tests (`tsd`-style, using `// @ts-expect-error` in a `.test-d.ts` compiled by `tsc`):
  `multiple` narrows `onValueChange`'s parameter type.

## 7. Docs (minimal, for 0.1.0)

- Package READMEs (EN/VI/CN): NativeSelect section with an anatomy snippet, props table and the
  placeholder pattern. The plan 00 §8 Note changes to "Select is in development; NativeSelect is
  available".
- `skills/omniselect-<fw>.md`: NativeSelect usage and gotchas (object values need `itemToKey`).
- Examples: one NativeSelect demo per example app (single, multi, inside a `<form>` showing
  FormData).

## 8. Phases

| Phase | Work | Gate |
| --- | --- | --- |
| P1 | React parts + driver + scenarios | React conformance green |
| P2 | Vue, Svelte, Vanilla parts + drivers | all conformance green |
| P3 | Subpath exports, import-graph test, SSR + type tests | `pnpm check` |
| P4 | Docs, skills, examples | `pnpm readme:check`; `dev:*` show demo |
| P5 | Pack + tarball inspection (plan 00 §6) | release 0.1.0 (manual publish) |

## 9. Out of scope

- Styled appearance (`appearance: base-select` customizable select). Revisit once it ships in
  all evergreen browsers. Tracked as a post-1.0 idea, not promised.
- Search inside native select.
