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
import type { Placement, DismissReason } from "@zealakit/omniselect-vue";
```

## Status

This release scaffolds the package. Only Overlay type re-exports exist today; do not generate
Select or Combobox component code against it until a release documents them.
