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

## Select

Select tùy biến với popover nổi, xây dựng trên Overlay. Nó theo mẫu combobox select-only của WAI-ARIA: focus ở lại trên trigger và item đang được đánh dấu được thông báo qua `aria-activedescendant`. Hãy import từ entry `/select`.

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
| `[data-part="trigger"]` | `button` | **Bắt buộc.** Trigger nhận focus. |
| `[data-part="popover"]` | bất kỳ | **Bắt buộc.** Bề mặt nổi. |
| `[data-part="list"]` | bất kỳ | **Bắt buộc.** Nằm trong popover. |
| `[data-part="item"]` | bất kỳ | `data-value` là key; `data-disabled` vô hiệu hóa nó. |
| `label`, `control`, `value`, `clear`, `indicator`, `group`, `group-label`, `item-indicator`, `empty` | bất kỳ | Các part tùy chọn, tìm bằng `data-part`. |

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValue` | `string \| null` | `null` | Giá trị ban đầu khi không điều khiển. |
| `onValueChange` | `(value: string \| null) => void` | — | Được gọi khi giá trị thay đổi. |
| `defaultOpen` | `boolean` | `false` | Trạng thái mở ban đầu. |
| `onOpenChange` | `(open, reason) => void` | — | Được gọi với trạng thái mới và một lý do: `trigger`, `keyboard`, `select`, `escape`, `tab`, `outside`, `toggle`, `empty` hoặc `imperative`. |
| `disabled`, `required` | `boolean` | `false` | Chặn việc mở và chọn. |
| `closeOnSelect` | `boolean` | `true` | Đóng sau khi chọn. |
| `allowsEmptyCollection` | `boolean` | `true` | Khi `false`, popover không mở nếu không có gì để hiển thị. |
| `loop` | `boolean` | `false` | Điều hướng bàn phím quay vòng ở hai đầu. |
| `placement`, `offset`, `matchWidth` | native | see below | Vị trí popover ưu tiên. |
| `portal` | `Element \| null` | `document.body` | `true` đưa vào `document.body`, một element thì đưa vào đó, `false` render tại chỗ. |
| `clearLabel` | `string` | `"Clear selection"` | Tên truy cập của nút Clear. |

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| null` | Key đã chọn. |
| `setValue(value)` | `void` | Chọn theo key. Không gọi `onValueChange`. |
| `open()`, `close()` | `void` | Thay đổi hiển thị. |
| `refresh()` | `void` | Đọc lại các item sau khi đổi markup. |
| `destroy()` | `void` | Gỡ listener và overlay. |

### Keyboard

| Key | Closed | Open |
| --- | --- | --- |
| ArrowDown / ArrowUp | Mở tại item đã chọn, đầu hoặc cuối | Di chuyển highlight |
| Home / End | Mở tại item đầu / cuối | Chuyển tới item đầu / cuối |
| PageDown / PageUp | — | Di chuyển mười item |
| Enter / Space | Mở | Chọn item đang highlight |
| Alt+ArrowUp | — | Chọn item đang highlight và đóng |
| Tab | — | Chọn item đang highlight, đóng và chuyển focus đi |
| Escape | — | Đóng và trả focus về trigger |
| Ký tự in được | Chọn item khớp | Highlight item khớp |
| Backspace / Delete | Xóa lựa chọn khi có `Clear` | — |

### Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Trigger, Control, Indicator, Popover, List | `open` hoặc `closed`. |
| `data-placeholder` | Trigger, Value | Chưa chọn gì. |
| `data-highlighted` | Item | Highlight từ bàn phím hoặc con trỏ. |
| `data-selected`, `data-state` | Item | Đã chọn (`checked`) hay chưa. |
| `data-disabled` | Các part của Root, Item, Group | Trạng thái vô hiệu hóa. |
| `data-side`, `data-align` | Popover | Placement sau khi tính toán. |
| `--omniselect-anchor-width` | Popover | Chiều rộng của control, dùng cho `matchWidth`. |
| `--omniselect-available-height` | Popover | Khoảng trống còn lại ở phía của popover. |

### Notes

- Các item đăng ký khi popover được mount. Trước khi mở, giá trị đã chọn chưa có nhãn: hãy truyền `itemToString`, hoặc đặt `forceMount` cho `Popover` để giữ các item được đăng ký (cách này cũng cho phép type-ahead hoạt động khi đang đóng).
- `Popover` giữ nguyên mount với `data-state="closed"` cho đến khi animation thoát bằng CSS kết thúc, nên hãy animate bằng CSS thuần.
- Escape và nhấn ra ngoài đi qua layer stack dùng chung của Overlay. Select trong `Dialog` của Overlay sẽ đóng trước khi nhấn Escape. Trong Dialog modal, hãy đặt `portal={false}` (hoặc portal vào nội dung dialog), vì dialog modal đánh dấu inert các phần tử khác của body.
- `Clear` và `Indicator` không được nằm trong `Trigger`, còn `Item`, `Group` và `Empty` phải nằm trong `List`; bản development sẽ cảnh báo nếu sai.
- Giá trị là chuỗi. Các item nằm trong markup và được đọc lại bằng `refresh()`; popover ẩn ngay khi đóng nên không có animation thoát.

## Status

`NativeSelect` và `Select` đã sẵn sàng. Tìm kiếm combobox, chọn nhiều và tải bất đồng bộ sẽ có ở các bản release sau, nên package cũng chỉ export các type của Overlay bên dưới.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — quy tắc cài đặt và import cho Vanilla.

## License

MIT © Zealakit
