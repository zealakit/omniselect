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
import type { Placement, DismissReason } from "@zealakit/omniselect-svelte";
```

## Status

This release scaffolds the package. Only Overlay type re-exports exist today; do not generate
Select or Combobox component code against it until a release documents them.
