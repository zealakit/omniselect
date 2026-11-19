# @zealakit/omniselect-svelte

[English](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

适用于 Svelte 的 headless Select 与 Combobox。视觉样式由你负责。

使用你自己的 CSS 和 `data-*` 状态属性为各部分设置样式。Omniselect 不附带 CSS、图标或动画。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。虚拟化、可创建选项和内置标签组件尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Install

```bash
npm install @zealakit/omniselect-svelte

# or yarn, pnpm, ...
```

Peer 依赖：`svelte` `^5.0.0`。应用已提供它。
`@zealakit/overlay-svelte` 会作为依赖自动安装。内部的 `@zealakit/omniselect-core` 已打包在此包内，不会发布到 npm；无需再安装其他内容。仅支持 ESM。

## NativeSelect

带有关联标签、对象值和原生表单行为的语义化 `<select>`。从 `/native` 入口导入，可避免把 Overlay 打进你的包。

### Quick start

```svelte
<script lang="ts">
  import { NativeSelect } from "@zealakit/omniselect-svelte/native";

  let fruit = $state("apple");
</script>

<NativeSelect.Root bind:value={fruit} name="fruit">
  <NativeSelect.Label>Fruit</NativeSelect.Label>
  <NativeSelect.Control>
    <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
    <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
  </NativeSelect.Control>
  <NativeSelect.Indicator>▾</NativeSelect.Indicator>
</NativeSelect.Root>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (`bind:value`) | `T \| null` (`T[]` with `multiple`) | — | 受控值。 |
| `defaultValue` | same | `null` (`[]`) | 非受控时的初始值。 |
| `onValueChange` | `(value) => void` | — | 每次用户更改以及表单重置时调用。 |
| `multiple` | `boolean` | `false` | 选择数组而不是单个值。 |
| `itemToKey` | `(value: T) => string` | `String` | 将值映射为 `<option value>` 以及提交的表单值。 |
| `name`, `form`, `required`, `disabled`, `autocomplete` | native | — | 转发给 `<select>`。 |
| `children` | `Snippet` | — | 各个 part。Root 不渲染任何元素。 |

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

```svelte
<script lang="ts">
  import { Select } from "@zealakit/omniselect-svelte/select";

  let fruit = $state<string | null>("apple");
</script>

<Select.Root bind:value={fruit}>
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
      <Select.Item value="apple">Apple <Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item>
      <Select.Item value="banana">Banana</Select.Item>
    </Select.List>
  </Select.Popover>
</Select.Root>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (`bind:value`) | `T \| null` | — | 已选值。已定义时为受控。 |
| `defaultValue` | `T \| null` | `null` | 非受控时的初始值。 |
| `onValueChange` | `(value: T \| null) => void` | — | 值变化时调用。 |
| `open` (`bind:open`) | `boolean` | — | 受控的打开状态。 |
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
| `children` | `Snippet` | — | 各个 part。Root 不渲染任何元素。 |

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

### Combobox

添加 `Select.Input` 即可把 Select 变成可搜索的 combobox（WAI-ARIA 带列表自动补全的可编辑 combobox 模式）。输入框拥有 `role="combobox"` 并保持焦点；触发器变为带有 `triggerLabel` 名称的普通按钮。用户输入时会过滤选项。

```svelte
<Select.Root bind:value={fruit} bind:inputValue={query}>
  <Select.Control>
    <Select.Input placeholder="Search fruit" />
    <Select.Trigger><Select.Indicator>▾</Select.Indicator></Select.Trigger>
    <Select.Clear>×</Select.Clear>
  </Select.Control>
  <Select.Popover>
    <Select.List>
      <Select.Item value="apple">Apple</Select.Item>
      <Select.Empty>No results</Select.Empty>
    </Select.List>
  </Select.Popover>
</Select.Root>
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

### Multiple selection

设置 `multiple` 即可选择一个值数组。选择后列表保持打开，`Value` 会把标签连接起来，并且还提供已选项以便你渲染 chip。这是 APG 的 multiselectable listbox 模式：列表上有 `aria-multiselectable`，每个选项上有 `aria-selected`。

```svelte
<Select.Root bind:value={fruits} multiple name="fruits">
  <Select.Control>
    <Select.Trigger>
      <Select.Value placeholder="Pick fruit">
        {#snippet children({ items, remove })}
          {#each items as item (item.key)}
            <span onclick={() => remove(item.value)}>{item.label} ×</span>
          {/each}
        {/snippet}
      </Select.Value>
    </Select.Trigger>
  </Select.Control>
  <Select.Popover>
    <Select.List>
      <Select.Item value="apple">Apple</Select.Item>
      <Select.Item value="banana">Banana</Select.Item>
    </Select.List>
  </Select.Popover>
</Select.Root>
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

```svelte
<Select.List>
  {#each items as item (item.id)}
    <Select.Item value={item.id}>{item.name}</Select.Item>
  {/each}
  <Select.LoadMore isLoading={isFetching} hasMore={hasNextPage} onLoadMore={fetchNextPage}>
    Loading…
  </Select.LoadMore>
</Select.List>
```

### LoadMore props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | **required** | 正在获取一页数据。 |
| `hasMore` | `boolean` | **required** | 还有更多页。 |
| `onLoadMore` | `() => void` | **required** | 获取下一页。 |
| `rootMargin` | `string` | `"0px 0px 64px 0px"` | 围绕滚动容器的预取距离。 |
| `...div props` | — | — | 转发给哨兵元素，它带有 `aria-hidden`。 |

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

## Status

`NativeSelect`、`Select`（单选、多选、表单）、combobox 搜索和异步加载（`Select.LoadMore`）已可用。该包同样导出下面的 Overlay 类型。

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-svelte` |
| `Placement` (type) | `@zealakit/overlay-svelte` |

## Agent Skill

- [Omniselect Svelte](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-svelte.md) — Svelte 的安装与导入规则。

## License

MIT © Zealakit
