# @zealakit/omniselect-svelte

[English](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

适用于 Svelte 的 headless Select 与 Combobox。视觉样式由你负责。

使用你自己的 CSS 和 `data-*` 状态属性为各部分设置样式。Omniselect 不附带 CSS、图标或动画。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。异步加载、虚拟化、可创建选项和标签输入尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Install

```bash
npm install @zealakit/omniselect-svelte

# or yarn, pnpm, ...
```

Peer 依赖：`svelte` `^5.0.0`。应用已提供它。
`@zealakit/overlay-svelte` 会作为依赖自动安装。内部的 `@zealakit/omniselect-core` 已打包在此包内，不会发布到 npm；无需再安装其他内容。仅支持 ESM。

## Status

此版本仅搭建包的骨架。组件 API 将在后续版本提供，因此该包目前只导出下面的 Overlay 类型。

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-svelte` |
| `Placement` (type) | `@zealakit/overlay-svelte` |

## Agent Skill

- [Omniselect Svelte](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-svelte.md) — Svelte 的安装与导入规则。

## License

MIT © Zealakit
