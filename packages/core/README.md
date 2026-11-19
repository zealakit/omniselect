# @zealakit/omniselect-core

[English](https://github.com/zealakit/omniselect/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/core/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Internal selection, collection, keyboard-navigation, and filtering logic for every Zealakit Omniselect adapter. Core is private and never published to npm: every adapter bundles its own copy, so application code uses the adapter for its framework. This reference is for contributors working on the adapters inside the monorepo.

Core renders nothing and ships no CSS. It has zero runtime dependencies and never imports a framework or Overlay.

> **Note**
> Omniselect is a focused, headless set of primitives for Select and Combobox, built on Zealakit Overlay. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Virtualization, creatable options, and built-in tag components are not implemented.
>
> Omniselect is not a replacement for a full UI library or design system. Use it when you need accessible selection primitives without adopting a large kit, or when your current library's select is hard to restyle.

## Install

```bash
pnpm --filter @zealakit/omniselect-core run build
```

Core is not on npm, so it cannot be installed. It is built inside the workspace and, at release time, copied into each adapter tarball under `dist/vendor/core`. Page-global state lives on `globalThis`, so several adapters on one page still share it. No peer dependencies and no runtime dependencies.

## Public API

| Export | Purpose |
| --- | --- |
| `getGlobalState(name, create)` | Page-global state shared by every bundled copy of core, stored on `globalThis` under a versioned `Symbol.for` key. |

Only the shared-state helper is exported today. Selection, collection, and navigation modules arrive with the component releases.

## License

MIT © Zealakit
