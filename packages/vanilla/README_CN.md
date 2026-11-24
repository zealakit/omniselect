# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.jpg?raw=true)

适用于 原生 JavaScript 和 TypeScript 的 headless Select 与 Combobox。视觉样式由你负责。

使用你自己的 CSS 和 `data-*` 状态属性为各部分设置样式。Omniselect 不附带 CSS、图标或动画。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。虚拟化、可创建选项和内置标签组件尚未实现。
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
| `setInvalid(invalid)` | `void` | 将字段标记为无效（`data-invalid`、`aria-invalid`）。 |
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

## Select

带浮动弹层的自定义 select，构建于 Overlay 之上。它遵循 WAI-ARIA 的 select-only combobox 模式：焦点留在触发器上，高亮项通过 `aria-activedescendant` 播报。请从 `/select` 入口导入。

### Quick start

```html
<div id="fruit">
  <span data-part="label">Fruit</span>
  <div data-part="control">
    <button data-part="trigger"><span data-part="value">Pick a fruit</span></button>
    <button data-part="clear">×</button>
  </div>
  <div data-part="popover">
    <div data-part="list">
      <div data-part="item" data-value="apple">Apple <span data-part="item-indicator">✓</span></div>
      <div data-part="item" data-value="banana">Banana</div>
    </div>
  </div>
</div>
```

```ts
import { createSelect } from "@zealakit/omniselect-vanilla/select";

const select = createSelect(document.getElementById("fruit") as HTMLElement, {
  defaultValue: "apple",
  onValueChange: (value) => console.log(value),
});

select.destroy();
```

### Props

| Marker | Element | Purpose |
| --- | --- | --- |
| `[data-part="trigger"]` | `button` | **必需。** 可聚焦的触发器。 |
| `[data-part="popover"]` | 任意 | **必需。** 浮动层。 |
| `[data-part="list"]` | 任意 | **必需。** 位于弹层内。 |
| `[data-part="item"]` | 任意 | `data-value` 是 key；`data-disabled` 将其禁用。 |
| `label`、`control`、`value`、`clear`、`indicator`、`group`、`group-label`、`item-indicator`、`empty` | 任意 | 可选 part，通过 `data-part` 查找。 |

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValue` | `string \| null` | `null` | 非受控时的初始值。 |
| `onValueChange` | `(value: string \| null) => void` | — | 值变化时调用。 |
| `defaultOpen` | `boolean` | `false` | 初始打开状态。 |
| `onOpenChange` | `(open, reason) => void` | — | 以新状态和原因调用：`trigger`、`keyboard`、`select`、`escape`、`tab`、`outside`、`toggle`、`empty` 或 `imperative`。 |
| `disabled`, `required` | `boolean` | `false` | 禁止打开和选择。 |
| `closeOnSelect` | `boolean` | `true` | 选择后关闭。 |
| `allowsEmptyCollection` | `boolean` | `true` | 为 `false` 时，没有内容可显示就不打开弹层。 |
| `loop` | `boolean` | `false` | 键盘导航在两端循环。 |
| `placement`, `offset`, `matchWidth` | native | see below | 弹层的首选位置。 |
| `portal` | `Element \| null` | `document.body` | `true` 传送到 `document.body`，传入元素则传送到该元素，`false` 原地渲染。 |
| `clearLabel` | `string` | `"Clear selection"` | 清除按钮的可访问名称。 |

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| null` | 已选 key。 |
| `setValue(value)` | `void` | 按 key 选择。不会调用 `onValueChange`。 |
| `setInvalid(invalid)` | `void` | 将字段标记为无效（`data-invalid`、`aria-invalid`）。 |
| `open()`、`close()` | `void` | 改变可见性。 |
| `refresh()` | `void` | 修改标记后重新读取选项。 |
| `destroy()` | `void` | 移除监听器和 overlay。 |

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

### Combobox

添加 `Select.Input` 即可把 Select 变成可搜索的 combobox（WAI-ARIA 带列表自动补全的可编辑 combobox 模式）。输入框拥有 `role="combobox"` 并保持焦点；触发器变为带有 `triggerLabel` 名称的普通按钮。用户输入时会过滤选项。

```html
<div data-part="control">
  <input data-part="input" type="text" placeholder="Search fruit" />
  <button data-part="trigger" type="button">▾</button>
</div>
```

### Combobox props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `inputValue`、`defaultInputValue` | `string` | `""` | 搜索文本。定义 `inputValue` 时为受控。 |
| `onInputChange` | `(text, reason) => void` | — | 原因：`input`、`select`、`clear`、`close` 或 `reset`。 |
| `filter` | `FilterFn \| false` | contains | 自定义 `(item, query) => boolean`，或 `false` 表示在外部过滤（异步搜索）。 |
| `openOnFocus`、`openOnInput` | `boolean` | `false`、`true` | 输入框获得焦点时或输入时打开。 |
| `selectionBehavior` | `"replace-input" \| "keep-input" \| "clear-input"` | `"replace-input"` | 选择后输入框显示的内容。 |
| `restoreOnBlur` | `boolean` | `true` | 输入框失焦时还原已选标签。 |
| `autoHighlight`、`autoSelectOnTab` | `boolean` | `true`、`false` | 输入时高亮第一个匹配项；按 Tab 时选中高亮项。 |
| `triggerLabel` | `string` | `"Show options"` | combobox 模式下触发器的可访问名称。 |

### Combobox keyboard

| Key | Closed | Open |
| --- | --- | --- |
| 输入 | 编辑文本并打开列表 | 过滤选项 |
| ArrowDown / ArrowUp | 在第一项 / 最后一项处打开 | 移动高亮 |
| Alt+ArrowDown | 打开但不高亮 | — |
| Enter | 交给表单处理 | 选中高亮项 |
| Escape | 清除文本 | 关闭并还原已选标签 |
| Tab | — | 关闭；仅在 `autoSelectOnTab` 时选中 |
| Space | 输入空格 | 输入空格 |

过滤不区分重音和大小写。被过滤掉的选项仍保持注册但不渲染内容，没有匹配项的分组会自行隐藏。使用 IME 输入时，按键处理和过滤会等到输入法组合结束。服务端渲染 select-only 标记，客户端的第一个 effect 会切换为 combobox 语义。

### Popover search

把 `Select.Input` 放在 `Select.Popover` 内、列表上方，即可得到内嵌在下拉层中的搜索框。触发器仍是普通的 select 控件（占位文本、值或 chip）。打开弹层会自动聚焦输入框，输入时方向键和 Enter 都可用，搜索框始终从空开始并在每次关闭时清空，选择也不会让它移位。输入框拥有 `role="combobox"`，触发器保留自己的标签和值，搜索框中按 Backspace 不会删除 chip，关闭时焦点回到触发器。在内联 combobox 中，按下控件上的任意位置（按钮和输入框除外）会聚焦输入框并打开列表。请把控件样式做成一个圆角容器，用 `--omniselect-anchor-width` 设置弹层宽度，并让搜索框 `position: sticky`；示例中展示了这一切。

```html
<div data-part="control">
  <button data-part="trigger" type="button"><span data-part="value">Pick a fruit</span></button>
</div>
<div data-part="popover">
  <div class="search"><input data-part="input" type="text" placeholder="Search…" /></div>
  <div data-part="list">
    <div data-part="item" data-value="apple">Apple</div>
    <div data-part="empty">No results</div>
  </div>
</div>
```

### Multiple selection

设置 `multiple` 即可选择一个值数组。选择后列表保持打开，`Value` 会把标签连接起来，并且还提供已选项以便你渲染 chip。这是 APG 的 multiselectable listbox 模式：列表上有 `aria-multiselectable`，每个选项上有 `aria-selected`。

```ts
const select = createSelect(root, {
  multiple: true,
  name: "fruits",
  defaultValue: ["apple"],
  onValueChange: (keys) => console.log(keys),
});

select.getValue(); // ["apple"]
```

### Multiple props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `multiple` | `boolean` | `false` | 选择值数组；`closeOnSelect` 默认为 `false`。 |
| `maxSelected` | `number` | — | 选满该数量后禁用其余选项。 |
| `announce`、`messages` | `boolean`、`{ added, removed }` | `true` | 通过礼貌的 live region 播报添加和移除；可覆盖文本用于 i18n。 |

### Multiple keyboard

| Key | Closed | Open |
| --- | --- | --- |
| Enter / Space | 打开 | 切换高亮项并保持列表打开 |
| Shift+ArrowDown / Shift+ArrowUp | — | 移动并将该项加入选择 |
| Ctrl+A / Cmd+A | — | 选中所有可见项（未设置 `maxSelected` 时） |
| Backspace | 输入框为空时移除最后一个值（combobox） | 输入框为空时移除最后一个值（combobox） |

### Forms

设置 `name`（或 `required`）会在 Root 内添加一个视觉隐藏的原生 `<select>`，因此值会像 `NativeSelect` 一样参与 `<form>` 提交、`FormData`、约束验证和表单重置。多个值会以重复条目的形式提交。

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name`、`form` | `string` | — | 字段名称以及所属 `<form>` 的 id。 |
| `required` | `boolean` | `false` | 未选择时阻止表单提交；触发器会获得 `data-invalid` 和焦点。 |
| `value` in FormData | keys | — | 每个值以其 `itemToKey` 字符串提交。 |

使用 `Select.Input` 时，选择后默认会清空输入框并保持列表打开（`selectionBehavior="clear-input"`）。表单重置会恢复 `defaultValue`（受控时会以它调用 `onValueChange`）。通过隐藏字段触发的自动填充会把 key 映射回值，并忽略未知 key。

### Async loading

`Select.LoadMore` 是分页数据的哨兵元素。请把它放在 `Select.List` 的最后；当列表打开、`hasMore` 为 `true` 且 `isLoading` 为 `false` 时，它滚动进入视野（或键盘到达最后一项）就会调用 `onLoadMore`。库本身从不发起请求：请求、分页状态和防抖都由你负责。

```ts
const select = createSelect(root, {
  onLoadMore: () => {
    select.setLoadMore({ isLoading: true });
    fetchPage().then((rows) => {
      appendItems(rows);
      select.setLoadMore({ isLoading: false, hasMore: rows.length > 0 });
    });
  },
});

select.setLoadMore({ hasMore: true });
```

### LoadMore props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onLoadMore` | `() => void` | — | 获取下一页。需要在列表末尾放置 `[data-part="load-more"]` 哨兵元素。 |
| `setLoadMore({ isLoading, hasMore })` | `(state) => void` | — | 报告页面状态；加载期间阻止重复请求。 |

### Async hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-loading` | LoadMore | 正在加载一页。 |
| `data-has-more` | LoadMore | 还有更多页。 |
| `aria-busy` | List | 正在加载一页。 |

`isLoading` 为 `true` 时会阻止重复请求。一页加载完成后若哨兵仍然可见（页面较短），无需再次滚动就会加载下一页。追加选项不会改变高亮、滚动位置或焦点。加载期间列表带有 `aria-busy`，`Empty` 会等到加载结束，live region 会播报进度（可用 `messages.loading` 和 `messages.loaded` 覆盖）。异步搜索时请组合 `filter={false}`、`onInputChange` 和 `LoadMore`；已选值通过 `itemToString` 保留标签。

### Notes

- 选项在弹层挂载后才会注册。在打开之前，已选值没有标签：请传入 `itemToString`，或给 `Popover` 设置 `forceMount` 以保持选项处于注册状态（这也让 type-ahead 在关闭时可用）。
- `Popover` 会以 `data-state="closed"` 保持挂载，直到 CSS 退出动画结束，因此请直接用 CSS 做动画。
- Escape 和外部点击会经过 Overlay 共享的层栈。位于 Overlay `Dialog` 内的 Select 会在 Escape 时先关闭。在模态 Dialog 内，请设置 `portal={false}`（或传送到对话框内容中），因为模态对话框会把 body 的其他子元素标记为 inert。
- `Clear` 和 `Indicator` 不能放在 `Trigger` 内，`Item`、`Group` 和 `Empty` 必须放在 `List` 内；开发构建在违反时会给出警告。
- 值是字符串。选项写在标记中，修改后用 `refresh()` 重新读取；弹层在关闭时立即隐藏，因此没有退出动画。

## Status

`NativeSelect`、`Select`（单选、多选、表单）、combobox 搜索和异步加载（`Select.LoadMore`）已可用。该包同样导出下面的 Overlay 类型。

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/ui-engine/position` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — Vanilla 的安装与导入规则。

## License

MIT © Zealakit
