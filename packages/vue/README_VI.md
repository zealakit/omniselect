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

## NativeSelect

`<select>` ngữ nghĩa có label liên kết, giá trị dạng object và hành vi form gốc. Hãy import từ entry `/native` để bundle của bạn không kéo theo Overlay.

### Quick start

```vue
<script setup lang="ts">
import { ref } from "vue";
import { NativeSelect } from "@zealakit/omniselect-vue/native";

const fruit = ref("apple");
</script>

<template>
  <NativeSelect.Root v-model="fruit" name="fruit">
    <NativeSelect.Label>Fruit</NativeSelect.Label>
    <NativeSelect.Control>
      <NativeSelect.Option value="apple">Apple</NativeSelect.Option>
      <NativeSelect.Option value="banana">Banana</NativeSelect.Option>
    </NativeSelect.Control>
    <NativeSelect.Indicator>▾</NativeSelect.Indicator>
  </NativeSelect.Root>
</template>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | `T \| null` (`T[]` with `multiple`) | — | Giá trị được điều khiển. |
| `defaultValue` | same | `null` (`[]`) | Giá trị ban đầu khi không điều khiển. |
| `@valueChange` | `(value) => void` | — | Được gọi ở mỗi thay đổi của người dùng và khi reset form. |
| `multiple` | `boolean` | `false` | Chọn một mảng thay vì một giá trị. |
| `itemToKey` | `(value) => string` | `String` | Ánh xạ giá trị sang `<option value>` và giá trị form được gửi đi. |
| `name`, `form`, `required`, `disabled`, `autocomplete` | native | — | Được chuyển tiếp tới `<select>`. |
| default slot | `VNode[]` | — | Các part. Root không render phần tử nào. |

### Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | không có | Giữ giá trị, các prop của form và tập hợp option. |
| `Label` | `label` | Được liên kết với control. |
| `Control` | `select` | Phần tử duy nhất nhận focus. Các prop khác được chuyển tiếp. |
| `Option` | `option` | `value`, `disabled`, `textValue`. |
| `OptionGroup` | `optgroup` | `label`, `disabled`; vô hiệu hóa nhóm sẽ vô hiệu hóa các option bên trong. |
| `Indicator` | `span` | Vị trí trang trí, có `aria-hidden`. |

### Placeholder

Render một option có value là `null` cho trạng thái trống. Key của nó là `""`, và control có `data-placeholder` khi option này được chọn.

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

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Select } from "@zealakit/omniselect-vue/select";

const fruit = ref<string | null>("apple");
</script>

<template>
  <Select.Root v-model="fruit">
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
</template>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | `T \| null` | — | Giá trị đã chọn. Được điều khiển khi có giá trị. |
| `defaultValue` | `T \| null` | `null` | Giá trị ban đầu khi không điều khiển. |
| `@valueChange` | `(value) => void` | — | Được gọi khi giá trị thay đổi. |
| `open` (`v-model:open`) | `boolean` | — | Trạng thái mở được điều khiển. |
| `defaultOpen` | `boolean` | `false` | Trạng thái mở ban đầu. |
| `@openChange` | `(open, reason) => void` | — | Được gọi với trạng thái mới và một lý do: `trigger`, `keyboard`, `select`, `escape`, `tab`, `outside`, `toggle`, `empty` hoặc `imperative`. |
| `itemToKey` | `(value: T) => string` | `String` | Ánh xạ giá trị sang key chuỗi ổn định. Mặc định `String`. |
| `itemToString` | `(value: T) => string` | `String` | Nhãn cho giá trị đã chọn khi item chưa được mount. |
| `disabled`, `required` | `boolean` | `false` | Chặn việc mở và chọn. |
| `closeOnSelect` | `boolean` | `true` | Đóng sau khi chọn. |
| `allowsEmptyCollection` | `boolean` | `true` | Khi `false`, popover không mở nếu không có gì để hiển thị. |
| `loop` | `boolean` | `false` | Điều hướng bàn phím quay vòng ở hai đầu. |
| `placement` | `Placement` | `"bottom-start"` | Vị trí popover ưu tiên. |
| `offset` | `number` | `4` | Khoảng cách giữa anchor và popover, tính bằng pixel. |
| `matchWidth` | `boolean` | `true` | Đặt `--omniselect-anchor-width` trên popover. |
| `portal` | `boolean \| Element` | `true` | `true` đưa vào `document.body`, một element thì đưa vào đó, `false` render tại chỗ. |
| `children` | `VNode[]` | — | Các part. Root không render phần tử nào. |

### Parts

| Part | Element | Notes |
| --- | --- | --- |
| `Root` | không có | Giữ state, id và tập hợp option. |
| `Label` | `span` | Tên truy cập, được trigger tham chiếu. |
| `Control` | `div` | Nhóm trigger và clear; popover neo vào đây. |
| `Trigger` | `button` | `role="combobox"`; bật/tắt popover và xử lý bàn phím. |
| `Value` | `span` | Nhãn đã chọn hoặc placeholder. |
| `Clear` | `button` | Đặt lại lựa chọn. Đặt cạnh trigger. |
| `Indicator` | `span` | Icon trang trí, có `aria-hidden`. |
| `Popover` | `div` | Bề mặt nổi có flip và shift, đóng bằng Escape và nhấn ra ngoài. |
| `List` | `div` | `role="listbox"`. |
| `Group`, `GroupLabel` | `div` | `role="group"` được gán nhãn bởi label; `disabled` lan xuống các item. |
| `Item` | `div` | `role="option"`; nhận `value`, `disabled`, `textValue`. |
| `ItemIndicator` | `span` | Chỉ render khi item được chọn. |
| `Empty` | `div` | Render khi không có gì để hiển thị. |

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `Popover` `forceMount` | `boolean` | `false` | Giữ popover trong DOM (ẩn) khi đóng. |
| `Value` `placeholder` | `string` | — | Hiển thị khi chưa chọn gì. |
| `Clear` `label` | `string` | `"Clear selection"` | Tên truy cập của nút Clear. |
| `Item` `value`, `disabled`, `textValue` | `T`, `boolean`, `string` | — | Giá trị của option; trigger hiển thị phần text của nó. Text dùng cho Value và type-ahead. |

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

## Status

`NativeSelect` và `Select` đã sẵn sàng. Tìm kiếm combobox, chọn nhiều và tải bất đồng bộ sẽ có ở các bản release sau, nên package cũng chỉ export các type của Overlay bên dưới.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vue` |
| `Placement` (type) | `@zealakit/overlay-vue` |

## Agent Skill

- [Omniselect Vue](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vue.md) — quy tắc cài đặt và import cho Vue.

## License

MIT © Zealakit
