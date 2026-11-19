---
name: omniselect-vanilla
description: >-
  Use when adding @zealakit/omniselect-vanilla to a plain TypeScript or JavaScript app: install, imports, and what the package
  exports today. The Select and Combobox components land in later releases.
---

# Omniselect for Vanilla

Use `@zealakit/omniselect-vanilla` for headless Select and Combobox primitives. The package owns selection state,
keyboard navigation, and ARIA wiring on top of `@zealakit/overlay-vanilla`. You own all CSS and
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
`@zealakit/overlay-vanilla` is installed automatically. If the app also uses Overlay directly,
keep its Overlay adapter on the same major version.

## Import

```ts
import { createNativeSelect } from "@zealakit/omniselect-vanilla/native";
import { createSelect } from "@zealakit/omniselect-vanilla/select";
```

Import from the `/native` entry so Overlay stays out of the bundle.

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
- Inside a modal Overlay Dialog, set `portal: null` in the options (a modal marks other body children inert).
- Not implemented yet: search input (combobox), multiple selection, form `name`, async loading.

## Status

`NativeSelect` and `Select` are available. `Select.Input`, multiple selection, and `Select.LoadMore` land in later releases; do not generate code for them until a release documents them.
