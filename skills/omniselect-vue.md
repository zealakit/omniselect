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

## Status

`NativeSelect` is available. `Select` and `Combobox` land in later releases; do not generate code for them until a release documents them.
