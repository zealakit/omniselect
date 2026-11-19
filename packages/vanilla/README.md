# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Headless Select and Combobox for vanilla JavaScript and TypeScript. You own visual styling.

Style the parts with your own CSS and `data-*` state attributes. Omniselect ships no CSS, icons, or animations.

> **Note**
> Omniselect is a focused, headless set of primitives for Select and Combobox, built on Zealakit Overlay. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Async loading, virtualization, creatable options, and tag inputs are not implemented.
>
> Omniselect is not a replacement for a full UI library or design system. Use it when you need accessible selection primitives without adopting a large kit, or when your current library's select is hard to restyle.

## Install

```bash
npm install @zealakit/omniselect-vanilla

# or yarn, pnpm, ...
```

No peer dependencies.
`@zealakit/overlay-vanilla` is installed automatically as a dependency. The internal `@zealakit/omniselect-core` is bundled inside this package and is not published to npm; there is nothing else to install. ESM only.

## NativeSelect

A semantic `<select>` with a linked label, object values, and native form behavior. Import it from the `/native` entry to keep Overlay out of your bundle.

### Quick start

```html
<div id="fruit">
  <label>Fruit</label>
  <select name="fruit">
    <option value="apple" selected>Apple</option>
    <option value="banana">Banana</option>
  </select>
  <span data-part="indicator">▾</span>
</div>
```

```ts
import { createNativeSelect } from "@zealakit/omniselect-vanilla/native";

const handle = createNativeSelect(document.getElementById("fruit") as HTMLElement, {
  onValueChange: (value) => console.log(value),
});

handle.setValue("banana");
handle.destroy();
```

### Markup

| Marker | Element | Purpose |
| --- | --- | --- |
| root element | any | Contains the `<select>`. May be the `<select>` itself. |
| `label` | `label` | Linked to the select with `for`. |
| `[data-part="indicator"]` | any | Decorative slot, set to `aria-hidden`. |

### Props

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onValueChange` | `(value: string \| string[]) => void` | — | Called on every user change and on form reset. |

`createNativeSelect(root, options)` returns a handle.

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| string[]` | Current key, or an array of keys when `multiple`. |
| `setValue(value)` | `void` | Select by key. Does not call `onValueChange`. |
| `refresh()` | `void` | Re-read `disabled`, `required`, and the selection. |
| `destroy()` | `void` | Remove listeners. |

### Placeholder

Add `selected` (and usually `disabled`) to the placeholder option with an empty `value`. Browsers otherwise pick the first enabled option. The control gets `data-placeholder` while it is selected.

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
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — install and import rules for Vanilla.

## License

MIT © Zealakit
