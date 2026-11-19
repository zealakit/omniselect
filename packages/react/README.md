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

## NativeSelect

A semantic `<select>` with a linked label, object values, and native form behavior. Import it from the `/native` entry to keep Overlay out of your bundle.

### Quick start

```tsx
import { NativeSelect } from "@zealakit/omniselect-react/native";

export function FruitSelect() {
  return (
    <NativeSelect.Root defaultValue="apple" name="fruit" onValueChange={(value) => console.log(value)}>
      <NativeSelect.Label>Fruit</NativeSelect.Label>
      <NativeSelect.Control>
        <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
        <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
      </NativeSelect.Control>
      <NativeSelect.Indicator>▾</NativeSelect.Indicator>
    </NativeSelect.Root>
  );
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `T \| null` (`T[]` with `multiple`) | — | Controlled value. |
| `defaultValue` | same | `null` (`[]`) | Initial value when uncontrolled. |
| `onValueChange` | `(value) => void` | — | Called on every user change and on form reset. |
| `multiple` | `boolean` | `false` | Selects an array instead of one value. |
| `itemToKey` | `(value: T) => string` | `String` | Maps a value to `<option value>` and to the submitted form value. |
| `name`, `form`, `required`, `disabled`, `autoComplete` | native | — | Forwarded to the `<select>`. |
| `children` | `ReactNode` | — | The parts. The Root renders no element. |

### Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | none | Owns value, form props, and the option collection. |
| `Label` | `label` | Linked to the control. |
| `Control` | `select` | The only focusable element. Other props are forwarded. |
| `Option` | `option` | `value`, `disabled`, `textValue`. |
| `OptionGroup` | `optgroup` | `label`, `disabled`; disabling it disables its options. |
| `Indicator` | `span` | Decorative slot, `aria-hidden`. |

### Placeholder

Render an option whose value is `null` for the empty state. Its key is `""`, and the control gets `data-placeholder` while it is selected.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-disabled` | Control, Label, Indicator, Option, OptionGroup | Disabled state. |
| `data-required` | Control, Label | The field is required. |
| `data-invalid` | Control | Set after the browser `invalid` event, cleared on change. |
| `data-placeholder` | Control | A single value is empty. |

## Status

`NativeSelect` is available. `Select` and `Combobox` land in later releases, so the package also exports only the Overlay types below.

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
