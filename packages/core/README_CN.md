# @zealakit/omniselect-core

[English](https://github.com/zealakit/omniselect/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/core/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

为每个 Zealakit Omniselect 适配器提供的内部选择、集合、键盘导航和过滤逻辑。Core 是私有包，绝不会发布到 npm：每个适配器都打包了自己的副本，因此应用代码应使用对应框架的适配器。本文面向在 monorepo 内开发适配器的贡献者。

Core 不渲染任何内容，也不附带 CSS。它没有运行时依赖，也绝不导入框架或 Overlay。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。异步加载、虚拟化、可创建选项和标签输入尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Install

```bash
pnpm --filter @zealakit/omniselect-core run build
```

Core 不在 npm 上，因此无法安装。它在工作区内构建，并在发布时复制到每个适配器 tarball 的 `dist/vendor/core` 下。页面级全局状态存放在 `globalThis` 上，因此同一页面上的多个适配器仍然共享它。没有 peer 依赖，也没有运行时依赖。

## Public API

| Export | Purpose |
| --- | --- |
| `getGlobalState(name, create)` | 所有已打包的 core 副本共享的页面级状态，存放在 `globalThis` 上带版本号的 `Symbol.for` 键下。 |

目前只导出共享状态辅助函数。选择、集合和导航模块将随组件版本一起提供。

## License

MIT © Zealakit
