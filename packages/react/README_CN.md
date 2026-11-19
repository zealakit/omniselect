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

## Select

带浮动弹层的自定义 select，构建于 Overlay 之上。它遵循 WAI-ARIA 的 select-only combobox 模式：焦点留在触发器上，高亮项通过 `aria-activedescendant` 播报。请从 `/select` 入口导入。

### Quick start

```tsx
import { Select } from "@zealakit/omniselect-react/select";

export function FruitSelect() {
  return (
    <Select.Root defaultValue="apple" onValueChange={(value) => console.log(value)}>
      <Select.Label>Fruit</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.Value placeholder="Pick a fruit" />
          <Select.Indicator>▾</Select.Indicator>
        </Select.Trigger>
        <Select.Clear>×</Select.Clear>
      </Select.Control>
      <Select.Popover>
        <Select.List>
          <Select.Item value="apple">
            Apple <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  );
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `T \| null` | — | 已选值。已定义时为受控。 |
| `defaultValue` | `T \| null` | `null` | 非受控时的初始值。 |
| `onValueChange` | `(value: T \| null) => void` | — | 值变化时调用。 |
| `open` | `boolean` | — | 受控的打开状态。 |
| `defaultOpen` | `boolean` | `false` | 初始打开状态。 |
| `onOpenChange` | `(open, reason) => void` | — | 以新状态和原因调用：`trigger`、`keyboard`、`select`、`escape`、`tab`、`outside`、`toggle`、`empty` 或 `imperative`。 |
| `itemToKey` | `(value: T) => string` | `String` | 将值映射为稳定的字符串 key。默认 `String`。 |
| `itemToString` | `(value: T) => string` | `String` | 已选值对应选项尚未挂载时使用的标签。 |
| `disabled`, `required` | `boolean` | `false` | 禁止打开和选择。 |
| `closeOnSelect` | `boolean` | `true` | 选择后关闭。 |
| `allowsEmptyCollection` | `boolean` | `true` | 为 `false` 时，没有内容可显示就不打开弹层。 |
| `loop` | `boolean` | `false` | 键盘导航在两端循环。 |
| `placement` | `Placement` | `"bottom-start"` | 弹层的首选位置。 |
| `offset` | `number` | `4` | 锚点与弹层之间的间距（像素）。 |
| `matchWidth` | `boolean` | `true` | 在弹层上设置 `--omniselect-anchor-width`。 |
| `portal` | `boolean \| Element` | `true` | `true` 传送到 `document.body`，传入元素则传送到该元素，`false` 原地渲染。 |
| `children` | `ReactNode` | — | 各个 part。Root 不渲染任何元素。 |

### Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | 无 | 持有状态、id 和选项集合。 |
| `Label` | `span` | 可访问名称，由触发器引用。 |
| `Control` | `div` | 将触发器和清除按钮组合在一起，弹层锚定于此。 |
| `Trigger` | `button` | `role="combobox"`；切换弹层并处理键盘。 |
| `Value` | `span` | 已选标签或占位文本。 |
| `Clear` | `button` | 重置选择。请放在触发器旁边。 |
| `Indicator` | `span` | 装饰图标，带 `aria-hidden`。 |
| `Popover` | `div` | 带翻转和平移的浮动层，可通过 Escape 和外部点击关闭。 |
| `List` | `div` | `role="listbox"`。 |
| `Group`、`GroupLabel` | `div` | 由其标签命名的 `role="group"`；`disabled` 会向下级联。 |
| `Item` | `div` | `role="option"`；接受 `value`、`disabled`、`textValue`。 |
| `ItemIndicator` | `span` | 仅在所属选项被选中时渲染。 |
| `Empty` | `div` | 没有内容可显示时渲染。 |

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `Popover` `forceMount` | `boolean` | `false` | 关闭时让弹层保留在 DOM 中（隐藏）。 |
| `Value` `placeholder` | `string` | — | 未选择时显示。 |
| `Clear` `label` | `string` | `"Clear selection"` | 清除按钮的可访问名称。 |
| `Item` `value`, `disabled`, `textValue` | `T`, `boolean`, `string` | — | 选项的值；触发器显示其文本。 用于 Value 和 type-ahead 的文本。 |

### Keyboard

| Key | Closed | Open |
| --- | --- | --- |
| ArrowDown / ArrowUp | 在已选项、第一项或最后一项处打开 | 移动高亮 |
| Home / End | 在第一项 / 最后一项处打开 | 移到第一项 / 最后一项 |
| PageDown / PageUp | — | 一次移动十项 |
| Enter / Space | 打开 | 选中高亮项 |
| Alt+ArrowUp | — | 选中高亮项并关闭 |
| Tab | — | 选中高亮项、关闭并移动焦点 |
| Escape | — | 关闭并将焦点还给触发器 |
| 可打印字符 | 选中匹配项 | 高亮匹配项 |
| Backspace / Delete | 挂载了 `Clear` 时清除 | — |

### Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Trigger、Control、Indicator、Popover、List | `open` 或 `closed`。 |
| `data-placeholder` | Trigger、Value | 尚未选择。 |
| `data-highlighted` | Item | 键盘或指针高亮。 |
| `data-selected`、`data-state` | Item | 已选（`checked`）或未选。 |
| `data-disabled` | Root 各 part、Item、Group | 禁用状态。 |
| `data-side`、`data-align` | Popover | 解析后的位置。 |
| `--omniselect-anchor-width` | Popover | control 的宽度，用于 `matchWidth`。 |
| `--omniselect-available-height` | Popover | 弹层所在一侧的剩余空间。 |

### Notes

- 选项在弹层挂载后才会注册。在打开之前，已选值没有标签：请传入 `itemToString`，或给 `Popover` 设置 `forceMount` 以保持选项处于注册状态（这也让 type-ahead 在关闭时可用）。
- `Popover` 会以 `data-state="closed"` 保持挂载，直到 CSS 退出动画结束，因此请直接用 CSS 做动画。
- Escape 和外部点击会经过 Overlay 共享的层栈。位于 Overlay `Dialog` 内的 Select 会在 Escape 时先关闭。在模态 Dialog 内，请设置 `portal={false}`（或传送到对话框内容中），因为模态对话框会把 body 的其他子元素标记为 inert。
- `Clear` 和 `Indicator` 不能放在 `Trigger` 内，`Item`、`Group` 和 `Empty` 必须放在 `List` 内；开发构建在违反时会给出警告。

## Status

`NativeSelect` 和 `Select` 已可用。Combobox 搜索、多选和异步加载将在后续版本提供，因此该包同样只导出下面的 Overlay 类型。

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
