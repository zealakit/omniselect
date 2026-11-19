---
name: omniselect-svelte
description: >-
  Use when adding @zealakit/omniselect-svelte to a Svelte 5 app: install, imports, and what the package
  exports today. The Select and Combobox components land in later releases.
---

# Omniselect for Svelte

Use `@zealakit/omniselect-svelte` for headless Select and Combobox primitives. The package owns selection state,
keyboard navigation, and ARIA wiring on top of `@zealakit/overlay-svelte`. You own all CSS and
visual markup.

`@zealakit/omniselect-core` is an internal package bundled inside the adapter and not published
to npm. Never install it or import from it in application code.

## Install

```bash
npm install @zealakit/omniselect-svelte
# or: pnpm add @zealakit/omniselect-svelte
# or: yarn add @zealakit/omniselect-svelte
```

Peer dependencies: `svelte` `^5.0.0`. The app already provides them.
`@zealakit/overlay-svelte` is installed automatically. If the app also uses Overlay directly,
keep its Overlay adapter on the same major version.

## Import

```ts
import { NativeSelect } from "@zealakit/omniselect-svelte/native";
import { Select } from "@zealakit/omniselect-svelte/select";
```

Import from the `/native` entry so Overlay stays out of the bundle.

## NativeSelect

```svelte
<NativeSelect.Root bind:value={fruit} name="fruit">
  <NativeSelect.Label>Fruit</NativeSelect.Label>
  <NativeSelect.Control>
    <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
    <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
  </NativeSelect.Control>
</NativeSelect.Root>
```

- Initialize the bound state (`let fruit = $state("apple")`); an `undefined` initial value means uncontrolled. `multiple` switches the value to an array.
- Object values need `itemToKey` (`(value) => string`); the key becomes `<option value>` and the submitted form value.
- A `null` option value is the placeholder (key `""`); the control gets `data-placeholder` while it is selected.
- Style with `data-disabled`, `data-required`, `data-invalid`, and `data-placeholder`. No CSS ships.

## Select

```svelte
<Select.Root bind:value={fruit}>
  <Select.Label>Fruit</Select.Label>
  <Select.Control>
    <Select.Trigger>
      <Select.Value placeholder="Pick a fruit" />
      <Select.Indicator>▾</Select.Indicator>
    </Select.Trigger>
    <Select.Clear>×</Select.Clear>
  </Select.Control>
  <Select.Popover>
    <Select.List>
      <Select.Item value="apple">Apple</Select.Item>
      <Select.Item value="banana">Banana</Select.Item>
    </Select.List>
  </Select.Popover>
</Select.Root>
```

- Select-only combobox: focus stays on `Trigger`; the highlighted item is exposed with `aria-activedescendant`. Do not move focus into the list.
- Place `Clear` and `Indicator` beside the trigger inside `Control`, never inside `Trigger`. `Item`, `Group`, and `Empty` go inside `List`.
- Items register while the popover is mounted. For a selected value without a mounted item, pass `itemToString`; set `forceMount` on `Popover` to keep items registered (needed for type-ahead while closed).
- Style with `data-state`, `data-highlighted`, `data-selected`, `data-disabled`, `data-placeholder`, and `--omniselect-anchor-width`. Animate exit with CSS only; `Popover` stays mounted until it ends.
- Inside a modal Overlay Dialog, set `portal={false}` on `Root` (a modal marks other body children inert).
- Not implemented yet: search input (combobox), multiple selection, form `name`, async loading.

## Status

`NativeSelect` and `Select` are available. `Select.Input`, multiple selection, and `Select.LoadMore` land in later releases; do not generate code for them until a release documents them.
