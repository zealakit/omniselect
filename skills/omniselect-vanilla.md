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
import type { Placement, DismissReason } from "@zealakit/omniselect-vanilla";
```

## Status

This release scaffolds the package. Only Overlay type re-exports exist today; do not generate
Select or Combobox component code against it until a release documents them.
