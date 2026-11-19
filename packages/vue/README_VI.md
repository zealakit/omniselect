# @zealakit/omniselect-vue

[English](https://github.com/zealakit/omniselect/blob/main/packages/vue/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vue/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vue/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Select và Combobox headless cho Vue. Bạn tự quyết định style hiển thị.

Style các phần bằng CSS của bạn và các thuộc tính trạng thái `data-*`. Omniselect không kèm CSS, icon hay animation.

> **Note**
> Omniselect là bộ primitive headless tập trung cho Select và Combobox, xây dựng trên Zealakit Overlay. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Tải dữ liệu bất đồng bộ, virtualization, tùy chọn do người dùng tạo và tag input chưa được triển khai.
>
> Omniselect không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive chọn giá trị có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi select trong thư viện hiện tại khó restyle.

## Install

```bash
npm install @zealakit/omniselect-vue

# or yarn, pnpm, ...
```

Peer dependency: `vue` `^3.5.0`. Ứng dụng đã có sẵn.
`@zealakit/overlay-vue` được cài tự động như một dependency. `@zealakit/omniselect-core` nội bộ được đóng gói sẵn trong package này và không được publish lên npm; không cần cài thêm gì khác. Chỉ hỗ trợ ESM.

## Status

Bản release này mới dựng khung package. API component sẽ có ở bản release sau, nên package hiện chỉ export các type của Overlay bên dưới.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vue` |
| `Placement` (type) | `@zealakit/overlay-vue` |

## Agent Skill

- [Omniselect Vue](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vue.md) — quy tắc cài đặt và import cho Vue.

## License

MIT © Zealakit
