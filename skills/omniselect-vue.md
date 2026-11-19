---
name: omniselect-vue
description: >-
  Use when adding @zealakit/omniselect-vue to a Vue 3.5+ app: install, imports, and what the package
  exports today. The Select and Combobox components land in later releases.
---

# Omniselect for Vue

Use `@zealakit/omniselect-vue` for headless Select and Combobox primitives. The package owns selection state,
keyboard navigation, and ARIA wiring on top of `@zealakit/overlay-vue`. You own all CSS and
visual markup.

`@zealakit/omniselect-core` is an internal package bundled inside the adapter and not published
to npm. Never install it or import from it in application code.

## Install

```bash
npm install @zealakit/omniselect-vue
# or: pnpm add @zealakit/omniselect-vue
# or: yarn add @zealakit/omniselect-vue
```

Peer dependencies: `vue` `^3.5.0`. The app already provides them.
`@zealakit/overlay-vue` is installed automatically. If the app also uses Overlay directly,
keep its Overlay adapter on the same major version.

## Import

```ts
import { NativeSelect } from "@zealakit/omniselect-vue/native";
import { Select } from "@zealakit/omniselect-vue/select";
```

Import from the `/native` entry so Overlay stays out of the bundle.

## NativeSelect

```vue
<NativeSelect.Root v-model="fruit" name="fruit">
  <NativeSelect.Label>Fruit</NativeSelect.Label>
  <NativeSelect.Control>
    <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
    <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
  </NativeSelect.Control>
</NativeSelect.Root>
```

- Use `v-model` (or `modelValue`) for controlled state and `defaultValue` for uncontrolled. `multiple` switches the value to an array. `@valueChange` fires on every change.
- Object values need `itemToKey` (`(value) => string`); the key becomes `<option value>` and the submitted form value.
- A `null` option value is the placeholder (key `""`); the control gets `data-placeholder` while it is selected.
- Style with `data-disabled`, `data-required`, `data-invalid`, and `data-placeholder`. No CSS ships.

## Select

```vue
<Select.Root v-model="fruit">
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
- Add `Select.Input` for a searchable combobox: the input takes `role="combobox"` and keeps focus, the trigger becomes a plain button (`triggerLabel`), and items are filtered as the user types (`filter`, `filter=false` for outside/async filtering, `selectionBehavior`, `restoreOnBlur`, `openOnFocus`). Never put focus in the list.
- `multiple` selects an array (the list stays open; `Value` exposes `items`, `remove`, `clear` for chips; `maxSelected` caps picks). `name` or `required` adds a hidden native `<select>` so the value joins `<form>`/`FormData`, validation, and reset like `NativeSelect`; object values submit their `itemToKey`.
- Async pagination: put `Select.LoadMore` (`isLoading`, `hasMore`, `onLoadMore`; vanilla: a `[data-part="load-more"]` sentinel plus `onLoadMore` and `setLoadMore`) last inside `Select.List`. The library never fetches. Duplicate requests are blocked while loading; the highlight, scroll, and focus stay put as items append. For async search use `filter={false}` + `onInputChange` + `LoadMore` and `itemToString` so selected values keep their labels.
- Form libraries (react-hook-form, vee-validate, TanStack Form, ...): pass their error state with the `invalid` prop (vanilla: `handle.setInvalid(bool)`); it sets `data-invalid` and `aria-invalid` and is not cleared by a change. Hook their blur/ref handlers to the trigger or input.

## Status

`NativeSelect`, `Select` (single and multiple, with forms), `Select.Input` (combobox), and `Select.LoadMore` are available. `Select.LoadMore` lands in a later release; do not generate code for them until a release documents them.
