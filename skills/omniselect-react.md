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
import type { Placement, DismissReason } from "@zealakit/omniselect-react";
```

## Status

This release scaffolds the package. Only Overlay type re-exports exist today; do not generate
Select or Combobox component code against it until a release documents them.
