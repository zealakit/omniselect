# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

适用于 原生 JavaScript 和 TypeScript 的 headless Select 与 Combobox。视觉样式由你负责。

使用你自己的 CSS 和 `data-*` 状态属性为各部分设置样式。Omniselect 不附带 CSS、图标或动画。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。异步加载、虚拟化、可创建选项和标签输入尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Install

```bash
npm install @zealakit/omniselect-vanilla

# or yarn, pnpm, ...
```

没有 peer 依赖。
`@zealakit/overlay-vanilla` 会作为依赖自动安装。内部的 `@zealakit/omniselect-core` 已打包在此包内，不会发布到 npm；无需再安装其他内容。仅支持 ESM。

## NativeSelect

带有关联标签、对象值和原生表单行为的语义化 `<select>`。从 `/native` 入口导入，可避免把 Overlay 打进你的包。

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
| root 元素 | 任意 | 包含 `<select>`，也可以就是 `<select>` 本身。 |
| `label` | `label` | 通过 `for` 与 select 关联。 |
| `[data-part="indicator"]` | 任意 | 装饰性插槽，会设置 `aria-hidden`。 |

### Props

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onValueChange` | `(value: string \| string[]) => void` | — | 每次用户更改以及表单重置时调用。 |

`createNativeSelect(root, options)` 返回一个 handle。

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| string[]` | 当前 key；`multiple` 时为 key 数组。 |
| `setValue(value)` | `void` | 按 key 选择。不会调用 `onValueChange`。 |
| `refresh()` | `void` | 重新读取 `disabled`、`required` 和选择状态。 |
| `destroy()` | `void` | 移除监听器。 |

### Placeholder

给 value 为空的占位 option 加上 `selected`（通常还有 `disabled`），否则浏览器会选中第一个可用的 option。选中时 control 会带有 `data-placeholder`。

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
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — Vanilla 的安装与导入规则。

## License

MIT © Zealakit
