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
- Style with `data-disabled`, `data-required`, `data-invalid`, and `data-placeholder`. No CSS ships.

## Status

`NativeSelect` is available. `Select` and `Combobox` land in later releases; do not generate code for them until a release documents them.
