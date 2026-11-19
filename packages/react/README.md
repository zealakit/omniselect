# @zealakit/omniselect-react

[English](https://github.com/zealakit/omniselect/blob/main/packages/react/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/react/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/react/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Headless Select and Combobox for React. You own visual styling.

Style the parts with your own CSS and `data-*` state attributes. Omniselect ships no CSS, icons, or animations.

> **Note**
> Omniselect is a focused, headless set of primitives for Select and Combobox, built on Zealakit Overlay. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Async loading, virtualization, creatable options, and tag inputs are not implemented.
>
> Omniselect is not a replacement for a full UI library or design system. Use it when you need accessible selection primitives without adopting a large kit, or when your current library's select is hard to restyle.

## Install

```bash
npm install @zealakit/omniselect-react

# or yarn, pnpm, ...
```

Peer dependencies: `react` and `react-dom` `^18.0.0 || ^19.0.0`. The app already provides them.
`@zealakit/overlay-react` is installed automatically as a dependency. The internal `@zealakit/omniselect-core` is bundled inside this package and is not published to npm; there is nothing else to install. ESM only.

## Status

This release scaffolds the package. The component API lands in a later release, so the package exports only the Overlay types below.

| Export | From |
| --- | --- |
| `AnimationConfig` (type) | `@zealakit/overlay-react` |
| `AnimationDirection` (type) | `@zealakit/overlay-react` |
| `AnimationDirectionSetting` (type) | `@zealakit/overlay-react` |
| `AnimationEasing` (type) | `@zealakit/overlay-react` |
| `AnimationSetting` (type) | `@zealakit/overlay-react` |
| `CustomAnimationClasses` (type) | `@zealakit/overlay-react` |
| `DismissReason` (type) | `@zealakit/overlay-react` |
| `Placement` (type) | `@zealakit/overlay-react` |
| `ResolvedAnimationConfig` (type) | `@zealakit/overlay-react` |

## Agent Skill

- [Omniselect React](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-react.md) — install and import rules for React.

## License

MIT © Zealakit
