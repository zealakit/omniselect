---
name: omniselect-react
description: >-
  Use when adding @zealakit/omniselect-react to a React 18/19 app: install, imports, and what the package
  exports today. The Select and Combobox components land in later releases.
---

# Omniselect for React

Use `@zealakit/omniselect-react` for headless Select and Combobox primitives. The package owns selection state,
keyboard navigation, and ARIA wiring on top of `@zealakit/overlay-react`. You own all CSS and
visual markup.

`@zealakit/omniselect-core` is an internal package bundled inside the adapter and not published
to npm. Never install it or import from it in application code.

## Install

```bash
npm install @zealakit/omniselect-react
# or: pnpm add @zealakit/omniselect-react
# or: yarn add @zealakit/omniselect-react
```

Peer dependencies: `react` and `react-dom` `^18.0.0 || ^19.0.0`. The app already provides them.
`@zealakit/overlay-react` is installed automatically. If the app also uses Overlay directly,
keep its Overlay adapter on the same major version.

## Import

```ts
import { NativeSelect } from "@zealakit/omniselect-react/native";
```

Import from the `/native` entry so Overlay stays out of the bundle.

## NativeSelect

```tsx
<NativeSelect.Root defaultValue="apple" name="fruit" onValueChange={setFruit}>
  <NativeSelect.Label>Fruit</NativeSelect.Label>
  <NativeSelect.Control>
    <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
    <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
  </NativeSelect.Control>
</NativeSelect.Root>
```

- Controlled: pass `value` and update it in `onValueChange`. `multiple` switches the value type to `T[]`.
- Object values need `itemToKey` (`(value) => string`); the key becomes `<option value>` and the submitted form value.
- A `null` option value is the placeholder (key `""`); the control gets `data-placeholder` while it is selected.
- Style with `data-disabled`, `data-required`, `data-invalid`, and `data-placeholder`. No CSS ships.

## Status

`NativeSelect` is available. `Select` and `Combobox` land in later releases; do not generate code for them until a release documents them.
