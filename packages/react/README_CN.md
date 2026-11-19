# @zealakit/omniselect-react

[English](https://github.com/zealakit/omniselect/blob/main/packages/react/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/react/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/react/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

适用于 React 的 headless Select 与 Combobox。视觉样式由你负责。

使用你自己的 CSS 和 `data-*` 状态属性为各部分设置样式。Omniselect 不附带 CSS、图标或动画。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。异步加载、虚拟化、可创建选项和标签输入尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Install

```bash
npm install @zealakit/omniselect-react

# or yarn, pnpm, ...
```

Peer 依赖：`react` 和 `react-dom` `^18.0.0 || ^19.0.0`。应用已提供它们。
`@zealakit/overlay-react` 会作为依赖自动安装。内部的 `@zealakit/omniselect-core` 已打包在此包内，不会发布到 npm；无需再安装其他内容。仅支持 ESM。

## NativeSelect

带有关联标签、对象值和原生表单行为的语义化 `<select>`。从 `/native` 入口导入，可避免把 Overlay 打进你的包。

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
| `value` | `T \| null` (`T[]` with `multiple`) | — | 受控值。 |
| `defaultValue` | same | `null` (`[]`) | 非受控时的初始值。 |
| `onValueChange` | `(value) => void` | — | 每次用户更改以及表单重置时调用。 |
| `multiple` | `boolean` | `false` | 选择数组而不是单个值。 |
| `itemToKey` | `(value: T) => string` | `String` | 将值映射为 `<option value>` 以及提交的表单值。 |
| `name`, `form`, `required`, `disabled`, `autoComplete` | native | — | 转发给 `<select>`。 |
| `children` | `ReactNode` | — | 各个 part。Root 不渲染任何元素。 |

### Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | 无 | 持有值、表单属性和选项集合。 |
| `Label` | `label` | 与 control 关联。 |
| `Control` | `select` | 唯一可聚焦的元素，其他 props 会被转发。 |
| `Option` | `option` | `value`、`disabled`、`textValue`。 |
| `OptionGroup` | `optgroup` | `label`、`disabled`；禁用分组会禁用其中的选项。 |
| `Indicator` | `span` | 装饰性插槽，带 `aria-hidden`。 |

### Placeholder

用 value 为 `null` 的 option 表示空状态。它的 key 是 `""`，选中时 control 会带有 `data-placeholder`。

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-disabled` | Control, Label, Indicator, Option, OptionGroup | 禁用状态。 |
| `data-required` | Control, Label | 字段为必填。 |
| `data-invalid` | Control | 浏览器触发 `invalid` 事件后设置，值改变时清除。 |
| `data-placeholder` | Control | 单选值为空。 |

## Status

`NativeSelect` 已可用。`Select` 和 `Combobox` 将在后续版本提供，因此该包同样只导出下面的 Overlay 类型。

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

- [Omniselect React](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-react.md) — React 的安装与导入规则。

## License

MIT © Zealakit
