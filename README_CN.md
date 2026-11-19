# Zealakit Omniselect

[English](https://github.com/zealakit/omniselect/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

用于在 Vanilla TypeScript、React、Vue 和 Svelte 中构建选择类界面的 headless Select 与 Combobox 原语。

- **Core** — 内部共享的逻辑包，负责选择、集合、键盘导航和过滤，已打包进每个适配器，不会单独发布。
- **Adapters** — React、Vue、Svelte 和 Vanilla 包。每个适配器都基于对应的 Zealakit Overlay 适配器来处理定位、层级和关闭。
- **SSR 安全** — 导入包时绝不会访问浏览器全局对象。

Omniselect 只处理选择状态、键盘导航、无障碍属性以及与 Overlay 的衔接，不附带样式、主题或图标。

> **Note**
> Omniselect 是专注于 Select 和 Combobox 的 headless 原语集合，构建于 Zealakit Overlay 之上。它不附带 CSS，也不渲染带样式的标记，因此视觉效果完全由你掌控。虚拟化、可创建选项和内置标签组件尚未实现。
>
> Omniselect 不是完整 UI 库或设计系统的替代品。当你需要无障碍的选择原语而不想引入大型组件库，或现有库的 select 难以重新设计样式时，请使用它。

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/omniselect-core` | 内部逻辑（已打包，不在 npm 上） | [README](https://github.com/zealakit/omniselect/blob/main/packages/core/README.md) |
| `@zealakit/omniselect-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) |
| `@zealakit/omniselect-react` | React 18 / 19 | [README](https://github.com/zealakit/omniselect/blob/main/packages/react/README.md) |
| `@zealakit/omniselect-vue` | Vue 3.5+ | [README](https://github.com/zealakit/omniselect/blob/main/packages/vue/README.md) |
| `@zealakit/omniselect-svelte` | Svelte 5 | [README](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README.md) |

请为你的框架安装一个适配器。你的应用已提供框架运行时，因此只需添加适配器。每个适配器会自动安装对应的 `@zealakit/overlay-*` 包，并打包 `@zealakit/omniselect-core`（它不会发布到 npm）；你无需直接安装或配置 core。各适配器之间不共享运行时。

## Installation

```bash
npm i @zealakit/omniselect-vanilla
npm i @zealakit/omniselect-react
npm i @zealakit/omniselect-vue
npm i @zealakit/omniselect-svelte

# or yarn, pnpm, ...
```

## Examples

[`examples/`](https://github.com/zealakit/omniselect/blob/main/examples) 目录包含 Vanilla、React、Vue、Svelte 和 Next.js 的可运行集成项目。它们导入已编译的工作区包，因此请先构建。每个示例都展示了 `NativeSelect` 和 `Select`，以及一个带校验的表单（react-hook-form + zod、vee-validate + zod、TanStack Form + zod，或纯 `FormData` + zod）。

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs
```

## Agent Skills

将你所用框架的集成 skill 添加到 agent 的 skills 目录：

- [Omniselect React](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-react.md) — React 的安装与导入规则。
- [Omniselect Vue](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vue.md) — Vue 的安装与导入规则。
- [Omniselect Svelte](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-svelte.md) — Svelte 的安装与导入规则。
- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — Vanilla 的安装与导入规则。

## License

MIT © Zealakit
