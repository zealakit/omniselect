# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Select và Combobox headless cho JavaScript và TypeScript thuần. Bạn tự quyết định style hiển thị.

Style các phần bằng CSS của bạn và các thuộc tính trạng thái `data-*`. Omniselect không kèm CSS, icon hay animation.

> **Note**
> Omniselect là bộ primitive headless tập trung cho Select và Combobox, xây dựng trên Zealakit Overlay. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Tải dữ liệu bất đồng bộ, virtualization, tùy chọn do người dùng tạo và tag input chưa được triển khai.
>
> Omniselect không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive chọn giá trị có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi select trong thư viện hiện tại khó restyle.

## Install

```bash
npm install @zealakit/omniselect-vanilla

# or yarn, pnpm, ...
```

Không có peer dependency.
`@zealakit/overlay-vanilla` được cài tự động như một dependency. `@zealakit/omniselect-core` nội bộ được đóng gói sẵn trong package này và không được publish lên npm; không cần cài thêm gì khác. Chỉ hỗ trợ ESM.

## NativeSelect

`<select>` ngữ nghĩa có label liên kết, giá trị dạng object và hành vi form gốc. Hãy import từ entry `/native` để bundle của bạn không kéo theo Overlay.

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
| phần tử root | bất kỳ | Chứa `<select>`. Có thể chính là `<select>`. |
| `label` | `label` | Liên kết với select bằng `for`. |
| `[data-part="indicator"]` | bất kỳ | Vị trí trang trí, được đặt `aria-hidden`. |

### Props

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onValueChange` | `(value: string \| string[]) => void` | — | Được gọi ở mỗi thay đổi của người dùng và khi reset form. |

`createNativeSelect(root, options)` trả về một handle.

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| string[]` | Key hiện tại, hoặc mảng key khi `multiple`. |
| `setValue(value)` | `void` | Chọn theo key. Không gọi `onValueChange`. |
| `refresh()` | `void` | Đọc lại `disabled`, `required` và lựa chọn. |
| `destroy()` | `void` | Gỡ các listener. |

### Placeholder

Thêm `selected` (và thường là `disabled`) cho option placeholder có `value` rỗng. Nếu không, trình duyệt sẽ chọn option khả dụng đầu tiên. Control có `data-placeholder` khi option này được chọn.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-disabled` | Control, Label, Indicator, Option, OptionGroup | Trạng thái vô hiệu hóa. |
| `data-required` | Control, Label | Trường bắt buộc. |
| `data-invalid` | Control | Được đặt sau sự kiện `invalid` của trình duyệt, xóa khi giá trị thay đổi. |
| `data-placeholder` | Control | Giá trị đơn đang trống. |

## Status

`NativeSelect` đã sẵn sàng. `Select` và `Combobox` sẽ có ở các bản release sau, nên package cũng chỉ export các type của Overlay bên dưới.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — quy tắc cài đặt và import cho Vanilla.

## License

MIT © Zealakit
