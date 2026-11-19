# Zealakit Omniselect

[English](https://github.com/zealakit/omniselect/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Headless Select and Combobox primitives for building selection UIs in Vanilla TypeScript, React, Vue, and Svelte.

- **Core** — an internal shared logic package for selection, collections, keyboard navigation, and filtering, bundled inside every adapter and never published on its own.
- **Adapters** — React, Vue, Svelte, and Vanilla packages. Each builds on the matching Zealakit Overlay adapter for positioning, layers, and dismissal.
- **SSR-safe** — importing a package never touches browser globals.

Omniselect only handles selection state, keyboard navigation, accessibility attributes, and wiring to Overlay. It does not ship styles, themes, or icons.

> **Note**
> Omniselect is a focused, headless set of primitives for Select and Combobox, built on Zealakit Overlay. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Virtualization, creatable options, and built-in tag components are not implemented.
>
> Omniselect is not a replacement for a full UI library or design system. Use it when you need accessible selection primitives without adopting a large kit, or when your current library's select is hard to restyle.

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/omniselect-core` | Internal logic (bundled, not on npm) | [README](https://github.com/zealakit/omniselect/blob/main/packages/core/README.md) |
| `@zealakit/omniselect-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) |
| `@zealakit/omniselect-react` | React 18 / 19 | [README](https://github.com/zealakit/omniselect/blob/main/packages/react/README.md) |
| `@zealakit/omniselect-vue` | Vue 3.5+ | [README](https://github.com/zealakit/omniselect/blob/main/packages/vue/README.md) |
| `@zealakit/omniselect-svelte` | Svelte 5 | [README](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README.md) |

Install one adapter for your framework. Your app already provides the framework runtime, so you only add the adapter. Each adapter installs its matching `@zealakit/overlay-*` package automatically and bundles `@zealakit/omniselect-core`, which is not published to npm; you never install or configure core directly. No runtime is shared between adapters.

## Installation

```bash
npm i @zealakit/omniselect-vanilla
npm i @zealakit/omniselect-react
npm i @zealakit/omniselect-vue
npm i @zealakit/omniselect-svelte

# or yarn, pnpm, ...
```

## Examples

The [`examples/`](https://github.com/zealakit/omniselect/blob/main/examples) folder holds runnable integration projects for Vanilla, React, Vue, Svelte, and Next.js. They import the compiled workspace packages, so build first. Each example shows a `NativeSelect` and a `Select`.

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs
```

## Agent Skills

Add the integration skill for your framework to your agent's skills directory:

- [Omniselect React](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-react.md) — install and import rules for React.
- [Omniselect Vue](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vue.md) — install and import rules for Vue.
- [Omniselect Svelte](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-svelte.md) — install and import rules for Svelte.
- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — install and import rules for Vanilla.

## License

MIT © Zealakit
