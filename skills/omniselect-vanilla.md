---
name: omniselect-vanilla
description: >-
  Use when adding @zealakit/omniselect-vanilla to a plain TypeScript or JavaScript app: install, imports, and what the package
  exports today. The Select and Combobox components land in later releases.
---

# Omniselect for Vanilla

Use `@zealakit/omniselect-vanilla` for headless Select and Combobox primitives. The package owns selection state,
keyboard navigation, and ARIA wiring on top of `@zealakit/ui-engine`. You own all CSS and
visual markup.

`@zealakit/omniselect-core` is an internal package bundled inside the adapter and not published
to npm. Never install it or import from it in application code.

## Install

```bash
npm install @zealakit/omniselect-vanilla
# or: pnpm add @zealakit/omniselect-vanilla
# or: yarn add @zealakit/omniselect-vanilla
```

No peer dependencies.
Install `@zealakit/ui-engine` as well: it is a required peer, shared by every Zealakit component
on the page.

## Import

```ts
import { createNativeSelect } from "@zealakit/omniselect-vanilla/native";
import { createSelect } from "@zealakit/omniselect-vanilla/select";
```

Import from the `/native` entry so the floating listbox stays out of the bundle.

## NativeSelect

```ts
const handle = createNativeSelect(rootElement, {
  onValueChange: (value) => console.log(value),
});
```

- Values are strings (an array of strings when the `<select>` is `multiple`). Put `selected` on a disabled placeholder option. Call `handle.destroy()` on teardown.
- Object values need `itemToKey` (`(value) => string`); the key becomes `<option value>` and the submitted form value.
- A `null` option value is the placeholder (key `""`); the control gets `data-placeholder` while it is selected.
- Items are `data-part="item"` elements with `data-value`; call `select.refresh()` after changing markup. Style with `data-disabled`, `data-required`, `data-invalid`, and `data-placeholder`. No CSS ships.

## Select

```ts
const select = createSelect(rootElement, {
  defaultValue: "apple",
  onValueChange: (value) => console.log(value),
});
```

- Select-only combobox: focus stays on `Trigger`; the highlighted item is exposed with `aria-activedescendant`. Do not move focus into the list.
- Place `Clear` and `Indicator` beside the trigger inside `Control`, never inside `Trigger`. `Item`, `Group`, and `Empty` go inside `List`.
- Items register while the popover is mounted. For a selected value without a mounted item, pass `itemToString`; set `forceMount` on `Popover` to keep items registered (needed for type-ahead while closed).
- Items are `data-part="item"` elements with `data-value`; call `select.refresh()` after changing markup. Style with `data-state`, `data-highlighted`, `data-selected`, `data-disabled`, `data-placeholder`, and `--omniselect-anchor-width`. Animate exit with CSS only; `Popover` stays mounted until it ends.
- Inside a modal dialog that makes the rest of the page inert, set `portal: null` in the options (a modal marks other body children inert).
- Add `Select.Input` for a searchable combobox: the input takes `role="combobox"` and keeps focus, the trigger becomes a plain button (`triggerLabel`), and items are filtered as the user types (`filter`, `filter=false` for outside/async filtering, `selectionBehavior`, `restoreOnBlur`, `openOnFocus`). Never put focus in the list.
- Popover search: put `Select.Input` inside `Select.Popover` above the list; the trigger stays a plain select control, the input is focused on open, starts empty, and clears on close (Backspace never removes chips there). In the inline combobox, pressing the control background focuses the input. Item labels ignore `aria-hidden`/`ItemIndicator` text.
- `multiple` selects an array (the list stays open; `Value` exposes `items`, `remove`, `clear` for chips; `maxSelected` caps picks). `name` or `required` adds a hidden native `<select>` so the value joins `<form>`/`FormData`, validation, and reset like `NativeSelect`; object values submit their `itemToKey`.
- Async pagination: put `Select.LoadMore` (`isLoading`, `hasMore`, `onLoadMore`; vanilla: a `[data-part="load-more"]` sentinel plus `onLoadMore` and `setLoadMore`) last inside `Select.List`. The library never fetches. Duplicate requests are blocked while loading; the highlight, scroll, and focus stay put as items append. For async search use `filter={false}` + `onInputChange` + `LoadMore` and `itemToString` so selected values keep their labels.
- For validation, report errors with `handle.setInvalid(bool)` (sets `data-invalid` and `aria-invalid`; not cleared by a change).

## Status

`NativeSelect`, `Select` (single and multiple, with forms), `Select.Input` (combobox), and `Select.LoadMore` are available. `Select.LoadMore` lands in a later release; do not generate code for them until a release documents them.
