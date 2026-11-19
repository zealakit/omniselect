# Zealakit Omniselect

[English](https://github.com/zealakit/omniselect/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Các primitive Select và Combobox headless để xây dựng giao diện chọn giá trị bằng Vanilla TypeScript, React, Vue và Svelte.

- **Core** — package logic dùng chung nội bộ cho selection, collection, điều hướng bàn phím và lọc, được đóng gói sẵn trong mọi adapter và không bao giờ được publish riêng.
- **Adapters** — các package React, Vue, Svelte và Vanilla. Mỗi adapter xây trên adapter Zealakit Overlay tương ứng để định vị, phân lớp và đóng overlay.
- **An toàn với SSR** — import package không bao giờ chạm vào biến toàn cục của trình duyệt.

Omniselect chỉ xử lý trạng thái chọn, điều hướng bàn phím, thuộc tính accessibility và kết nối với Overlay. Không kèm style, theme hay icon.

> **Note**
> Omniselect là bộ primitive headless tập trung cho Select và Combobox, xây dựng trên Zealakit Overlay. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Tải dữ liệu bất đồng bộ, virtualization, tùy chọn do người dùng tạo và tag input chưa được triển khai.
>
> Omniselect không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive chọn giá trị có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi select trong thư viện hiện tại khó restyle.

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/omniselect-core` | Logic nội bộ (đóng gói sẵn, không có trên npm) | [README](https://github.com/zealakit/omniselect/blob/main/packages/core/README.md) |
| `@zealakit/omniselect-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) |
| `@zealakit/omniselect-react` | React 18 / 19 | [README](https://github.com/zealakit/omniselect/blob/main/packages/react/README.md) |
| `@zealakit/omniselect-vue` | Vue 3.5+ | [README](https://github.com/zealakit/omniselect/blob/main/packages/vue/README.md) |
| `@zealakit/omniselect-svelte` | Svelte 5 | [README](https://github.com/zealakit/omniselect/blob/main/packages/svelte/README.md) |

Hãy cài một adapter cho framework của bạn. Ứng dụng của bạn đã có sẵn runtime của framework, nên bạn chỉ cần thêm adapter. Mỗi adapter tự cài package `@zealakit/overlay-*` tương ứng và đóng gói sẵn `@zealakit/omniselect-core`, vốn không được publish lên npm; bạn không bao giờ cài hay cấu hình core trực tiếp. Các adapter không dùng chung runtime.

## Installation

```bash
npm i @zealakit/omniselect-vanilla
npm i @zealakit/omniselect-react
npm i @zealakit/omniselect-vue
npm i @zealakit/omniselect-svelte

# or yarn, pnpm, ...
```

## Examples

Thư mục [`examples/`](https://github.com/zealakit/omniselect/blob/main/examples) chứa các dự án tích hợp chạy được cho Vanilla, React, Vue, Svelte và Next.js. Các dự án này import các package workspace đã build, nên hãy build trước. Mỗi ví dụ minh họa một `NativeSelect` trong form.

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs
```

## Agent Skills

Thêm skill tích hợp cho framework của bạn vào thư mục skills của agent:

- [Omniselect React](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-react.md) — quy tắc cài đặt và import cho React.
- [Omniselect Vue](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vue.md) — quy tắc cài đặt và import cho Vue.
- [Omniselect Svelte](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-svelte.md) — quy tắc cài đặt và import cho Svelte.
- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — quy tắc cài đặt và import cho Vanilla.

## License

MIT © Zealakit
