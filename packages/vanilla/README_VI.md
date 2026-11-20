# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.jpg)

Select và Combobox headless cho JavaScript và TypeScript thuần. Bạn tự quyết định style hiển thị.

Style các phần bằng CSS của bạn và các thuộc tính trạng thái `data-*`. Omniselect không kèm CSS, icon hay animation.

> **Note**
> Omniselect là bộ primitive headless tập trung cho Select và Combobox, xây dựng trên Zealakit Overlay. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Virtualization, tùy chọn do người dùng tạo và component tag dựng sẵn chưa được triển khai.
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
| `setInvalid(invalid)` | `void` | Đánh dấu trường không hợp lệ (`data-invalid`, `aria-invalid`). |
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
| `setInvalid(invalid)` | `void` | Đánh dấu trường không hợp lệ (`data-invalid`, `aria-invalid`). |
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

### Combobox

Thêm `Select.Input` để biến Select thành combobox có tìm kiếm (mẫu editable combobox với list autocomplete của WAI-ARIA). Input nhận `role="combobox"` và giữ focus; trigger trở thành một nút thường có nhãn từ `triggerLabel`. Các item được lọc khi người dùng gõ.

```html
<div data-part="control">
  <input data-part="input" type="text" placeholder="Search fruit" />
  <button data-part="trigger" type="button">▾</button>
</div>
```

### Combobox props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `inputValue`, `defaultInputValue` | `string` | `""` | Văn bản tìm kiếm. Được điều khiển khi có `inputValue`. |
| `onInputChange` | `(text, reason) => void` | — | Lý do: `input`, `select`, `clear`, `close` hoặc `reset`. |
| `filter` | `FilterFn \| false` | contains | Hàm `(item, query) => boolean` tùy biến, hoặc `false` để lọc bên ngoài (tìm kiếm bất đồng bộ). |
| `openOnFocus`, `openOnInput` | `boolean` | `false`, `true` | Mở khi input nhận focus hoặc khi đang gõ. |
| `selectionBehavior` | `"replace-input" \| "keep-input" \| "clear-input"` | `"replace-input"` | Input hiển thị gì sau khi chọn. |
| `restoreOnBlur` | `boolean` | `true` | Trả nhãn đã chọn về input khi mất focus. |
| `autoHighlight`, `autoSelectOnTab` | `boolean` | `true`, `false` | Highlight kết quả đầu khi gõ; chọn mục đang highlight khi nhấn Tab. |
| `triggerLabel` | `string` | `"Show options"` | Tên truy cập của trigger ở chế độ combobox. |

### Combobox keyboard

| Key | Closed | Open |
| --- | --- | --- |
| Gõ phím | Sửa văn bản và mở danh sách | Lọc các item |
| ArrowDown / ArrowUp | Mở tại item đầu / cuối | Di chuyển highlight |
| Alt+ArrowDown | Mở mà không highlight | — |
| Enter | Để form xử lý | Chọn item đang highlight |
| Escape | Xóa văn bản | Đóng và khôi phục nhãn đã chọn |
| Tab | — | Đóng; chỉ chọn khi có `autoSelectOnTab` |
| Space | Gõ dấu cách | Gõ dấu cách |

Việc lọc không phân biệt dấu và hoa thường. Các item bị lọc vẫn được đăng ký nhưng không render gì, và nhóm không có kết quả sẽ tự ẩn. Khi đang gõ bằng IME, phím và việc lọc chờ đến khi kết thúc composition. Server render markup select-only, và effect đầu tiên ở client chuyển sang ngữ nghĩa combobox.

### Popover search

Đặt `Select.Input` bên trong `Select.Popover`, phía trên danh sách, để có ô tìm kiếm nằm trong dropdown. Trigger vẫn là một select control thường (placeholder, giá trị hoặc chip). Mở popover sẽ focus vào input, phím mũi tên và Enter hoạt động khi đang gõ, ô tìm kiếm luôn bắt đầu rỗng và được xóa mỗi khi đóng, và việc chọn không làm nó dịch chuyển. Input giữ `role="combobox"` còn trigger giữ nhãn và giá trị của nó, Backspace trong ô không xóa chip, và focus quay về trigger khi đóng. Với combobox inline, nhấn vào bất kỳ chỗ nào trên control (không phải nút hay input) sẽ focus input và mở danh sách. Hãy style control như một container bo tròn duy nhất, dùng `--omniselect-anchor-width` cho độ rộng popover và đặt ô tìm kiếm `position: sticky`; các ví dụ minh họa tất cả điều này.

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

Đặt `multiple` để chọn một mảng giá trị. Danh sách vẫn mở sau mỗi lần chọn, `Value` nối các nhãn lại, và `Value` cũng cung cấp các item đã chọn để bạn render chip. Đây là mẫu listbox multiselectable của APG: `aria-multiselectable` trên list và `aria-selected` trên từng item.

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
| `multiple` | `boolean` | `false` | Chọn một mảng giá trị; `closeOnSelect` mặc định là `false`. |
| `maxSelected` | `number` | — | Vô hiệu hóa các item còn lại khi đã chọn đủ số này. |
| `announce`, `messages` | `boolean`, `{ added, removed }` | `true` | Thông báo thêm/bớt bằng live region lịch sự; ghi đè nội dung để hỗ trợ i18n. |

### Multiple keyboard

| Key | Closed | Open |
| --- | --- | --- |
| Enter / Space | Mở | Bật/tắt item đang highlight và giữ danh sách mở |
| Shift+ArrowDown / Shift+ArrowUp | — | Di chuyển và thêm item vào lựa chọn |
| Ctrl+A / Cmd+A | — | Chọn mọi item đang hiển thị (khi không có `maxSelected`) |
| Backspace | Xóa giá trị cuối khi input trống (combobox) | Xóa giá trị cuối khi input trống (combobox) |

### Forms

Đặt `name` (hoặc `required`) sẽ thêm một `<select>` gốc ẩn về mặt hiển thị vào trong Root, nên giá trị tham gia vào việc submit `<form>`, `FormData`, validation và reset form giống hệt `NativeSelect`. Nhiều giá trị được gửi dưới dạng các entry lặp lại.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name`, `form` | `string` | — | Tên trường và id của `<form>` sở hữu. |
| `required` | `boolean` | `false` | Chặn submit form khi chưa chọn gì; trigger nhận `data-invalid` và focus. |
| `value` in FormData | keys | — | Mỗi giá trị được gửi dưới dạng chuỗi `itemToKey`. |

Với `Select.Input`, mỗi lần chọn sẽ xóa input và giữ danh sách mở theo mặc định (`selectionBehavior="clear-input"`). Reset form khôi phục `defaultValue` (chế độ điều khiển: gọi `onValueChange` với giá trị đó). Autofill qua trường ẩn sẽ ánh xạ key về giá trị và bỏ qua key không rõ.

### Async loading

`Select.LoadMore` là phần tử canh cho dữ liệu phân trang. Đặt nó cuối cùng trong `Select.List`; nó gọi `onLoadMore` khi cuộn tới (hoặc khi bàn phím chạm item cuối) trong lúc danh sách mở, `hasMore` là `true` và `isLoading` là `false`. Thư viện không bao giờ tự fetch: bạn tự quản lý request, trạng thái trang và debounce.

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
| `onLoadMore` | `() => void` | — | Tải trang tiếp theo. Cần phần tử canh `[data-part="load-more"]` ở cuối list. |
| `setLoadMore({ isLoading, hasMore })` | `(state) => void` | — | Báo trạng thái trang; chặn request trùng lặp khi đang tải. |

### Async hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-loading` | LoadMore | Một trang đang tải. |
| `data-has-more` | LoadMore | Còn trang tiếp theo. |
| `aria-busy` | List | Một trang đang tải. |

Request trùng lặp bị chặn khi `isLoading` là `true`. Khi một trang tải xong mà phần tử canh vẫn đang hiển thị (trang ngắn), trang tiếp theo sẽ tải mà không cần cuộn thêm. Các item được thêm vào mà không làm đổi highlight, vị trí cuộn hay focus. List có `aria-busy` khi đang tải, `Empty` chờ đến khi tải xong, và live region thông báo tiến trình (ghi đè bằng `messages.loading` và `messages.loaded`). Với tìm kiếm bất đồng bộ, hãy kết hợp `filter={false}`, `onInputChange` và `LoadMore`; các giá trị đã chọn giữ nhãn nhờ `itemToString`.

### Notes

- Các item đăng ký khi popover được mount. Trước khi mở, giá trị đã chọn chưa có nhãn: hãy truyền `itemToString`, hoặc đặt `forceMount` cho `Popover` để giữ các item được đăng ký (cách này cũng cho phép type-ahead hoạt động khi đang đóng).
- `Popover` giữ nguyên mount với `data-state="closed"` cho đến khi animation thoát bằng CSS kết thúc, nên hãy animate bằng CSS thuần.
- Escape và nhấn ra ngoài đi qua layer stack dùng chung của Overlay. Select trong `Dialog` của Overlay sẽ đóng trước khi nhấn Escape. Trong Dialog modal, hãy đặt `portal={false}` (hoặc portal vào nội dung dialog), vì dialog modal đánh dấu inert các phần tử khác của body.
- `Clear` và `Indicator` không được nằm trong `Trigger`, còn `Item`, `Group` và `Empty` phải nằm trong `List`; bản development sẽ cảnh báo nếu sai.
- Giá trị là chuỗi. Các item nằm trong markup và được đọc lại bằng `refresh()`; popover ẩn ngay khi đóng nên không có animation thoát.

## Status

`NativeSelect`, `Select` (chọn một, chọn nhiều, form), tìm kiếm combobox và tải bất đồng bộ (`Select.LoadMore`) đã sẵn sàng. Package cũng export các type của Overlay bên dưới.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — quy tắc cài đặt và import cho Vanilla.

## License

MIT © Zealakit
