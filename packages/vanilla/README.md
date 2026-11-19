# @zealakit/omniselect-vanilla

[English](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/omniselect/blob/main/packages/vanilla/README_CN.md)

![Zealakit Omniselect cover](https://github.com/zealakit/omniselect/blob/main/assets/images/omniselect-cover.svg?raw=true)

Headless Select and Combobox for vanilla JavaScript and TypeScript. You own visual styling.

Style the parts with your own CSS and `data-*` state attributes. Omniselect ships no CSS, icons, or animations.

> **Note**
> Omniselect is a focused, headless set of primitives for Select and Combobox, built on Zealakit Overlay. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Async loading, virtualization, creatable options, and tag inputs are not implemented.
>
> Omniselect is not a replacement for a full UI library or design system. Use it when you need accessible selection primitives without adopting a large kit, or when your current library's select is hard to restyle.

## Install

```bash
npm install @zealakit/omniselect-vanilla

# or yarn, pnpm, ...
```

No peer dependencies.
`@zealakit/overlay-vanilla` is installed automatically as a dependency. The internal `@zealakit/omniselect-core` is bundled inside this package and is not published to npm; there is nothing else to install. ESM only.

## NativeSelect

A semantic `<select>` with a linked label, object values, and native form behavior. Import it from the `/native` entry to keep Overlay out of your bundle.

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
| root element | any | Contains the `<select>`. May be the `<select>` itself. |
| `label` | `label` | Linked to the select with `for`. |
| `[data-part="indicator"]` | any | Decorative slot, set to `aria-hidden`. |

### Props

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onValueChange` | `(value: string \| string[]) => void` | — | Called on every user change and on form reset. |

`createNativeSelect(root, options)` returns a handle.

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| string[]` | Current key, or an array of keys when `multiple`. |
| `setValue(value)` | `void` | Select by key. Does not call `onValueChange`. |
| `refresh()` | `void` | Re-read `disabled`, `required`, and the selection. |
| `destroy()` | `void` | Remove listeners. |

### Placeholder

Add `selected` (and usually `disabled`) to the placeholder option with an empty `value`. Browsers otherwise pick the first enabled option. The control gets `data-placeholder` while it is selected.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-disabled` | Control, Label, Indicator, Option, OptionGroup | Disabled state. |
| `data-required` | Control, Label | The field is required. |
| `data-invalid` | Control | Set after the browser `invalid` event, cleared on change. |
| `data-placeholder` | Control | A single value is empty. |

## Select

A custom select with a floating popover, built on Overlay. It uses the WAI-ARIA select-only combobox pattern: focus stays on the trigger and the highlighted item is announced through `aria-activedescendant`. Import it from the `/select` entry.

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
| `[data-part="trigger"]` | `button` | **Required.** Focusable trigger. |
| `[data-part="popover"]` | any | **Required.** Floating surface. |
| `[data-part="list"]` | any | **Required.** Inside the popover. |
| `[data-part="item"]` | any | `data-value` is the key; `data-disabled` disables it. |
| `label`, `control`, `value`, `clear`, `indicator`, `group`, `group-label`, `item-indicator`, `empty` | any | Optional parts, found by `data-part`. |

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValue` | `string \| null` | `null` | Initial value when uncontrolled. |
| `onValueChange` | `(value: string \| null) => void` | — | Called when the value changes. |
| `defaultOpen` | `boolean` | `false` | Initial open state. |
| `onOpenChange` | `(open, reason) => void` | — | Called with the new state and a reason: `trigger`, `keyboard`, `select`, `escape`, `tab`, `outside`, `toggle`, `empty`, or `imperative`. |
| `disabled`, `required` | `boolean` | `false` | Blocks opening and selecting. |
| `closeOnSelect` | `boolean` | `true` | Close after a pick. |
| `allowsEmptyCollection` | `boolean` | `true` | When `false`, the popover does not open while there is nothing to show. |
| `loop` | `boolean` | `false` | Wrap keyboard navigation at the ends. |
| `placement`, `offset`, `matchWidth` | native | see below | Preferred popover placement. |
| `portal` | `Element \| null` | `document.body` | `true` portals to `document.body`, an element portals there, `false` renders in place. |
| `clearLabel` | `string` | `"Clear selection"` | Accessible name of the Clear button. |

| Method | Returns | Description |
| --- | --- | --- |
| `getValue()` | `string \| null` | Selected key. |
| `setValue(value)` | `void` | Select by key. Does not call `onValueChange`. |
| `open()`, `close()` | `void` | Change visibility. |
| `refresh()` | `void` | Re-read items after changing the markup. |
| `destroy()` | `void` | Remove listeners and the overlay. |

### Keyboard

| Key | Closed | Open |
| --- | --- | --- |
| ArrowDown / ArrowUp | Opens on the selected, first, or last item | Moves the highlight |
| Home / End | Opens on the first / last item | Moves to the first / last item |
| PageDown / PageUp | — | Moves by ten items |
| Enter / Space | Opens | Selects the highlighted item |
| Alt+ArrowUp | — | Selects the highlighted item and closes |
| Tab | — | Selects the highlighted item, closes, and moves focus on |
| Escape | — | Closes and returns focus to the trigger |
| Printable characters | Selects the matching item | Highlights the matching item |
| Backspace / Delete | Clears, when a `Clear` is mounted | — |

### Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Trigger, Control, Indicator, Popover, List | `open` or `closed`. |
| `data-placeholder` | Trigger, Value | Nothing is selected. |
| `data-highlighted` | Item | The keyboard or pointer highlight. |
| `data-selected`, `data-state` | Item | Selected (`checked`) or not. |
| `data-disabled` | Root parts, Item, Group | Disabled state. |
| `data-side`, `data-align` | Popover | Resolved placement. |
| `--omniselect-anchor-width` | Popover | Width of the control, for `matchWidth`. |
| `--omniselect-available-height` | Popover | Room left on the popover's side. |

### Combobox

Add `Select.Input` to turn the Select into a searchable combobox (WAI-ARIA editable combobox with list autocomplete). The input takes `role="combobox"` and keeps focus; the trigger becomes a plain button labelled by `triggerLabel`. Items are filtered as the user types.

```html
<div data-part="control">
  <input data-part="input" type="text" placeholder="Search fruit" />
  <button data-part="trigger" type="button">▾</button>
</div>
```

### Combobox props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `inputValue`, `defaultInputValue` | `string` | `""` | Search text. Controlled when `inputValue` is defined. |
| `onInputChange` | `(text, reason) => void` | — | Reason: `input`, `select`, `clear`, `close`, or `reset`. |
| `filter` | `FilterFn \| false` | contains | Custom `(item, query) => boolean`, or `false` to filter outside (async search). |
| `openOnFocus`, `openOnInput` | `boolean` | `false`, `true` | Open when the input gains focus or while typing. |
| `selectionBehavior` | `"replace-input" \| "keep-input" \| "clear-input"` | `"replace-input"` | What the input shows after a pick. |
| `restoreOnBlur` | `boolean` | `true` | Put the selected label back when the input loses focus. |
| `autoHighlight`, `autoSelectOnTab` | `boolean` | `true`, `false` | Highlight the first match while typing; select the highlight on Tab. |
| `triggerLabel` | `string` | `"Show options"` | Accessible name of the trigger in combobox mode. |

### Combobox keyboard

| Key | Closed | Open |
| --- | --- | --- |
| Typing | Edits the text and opens the list | Filters the items |
| ArrowDown / ArrowUp | Opens on the first / last item | Moves the highlight |
| Alt+ArrowDown | Opens without a highlight | — |
| Enter | Left to the form | Selects the highlighted item |
| Escape | Clears the text | Closes and restores the selected label |
| Tab | — | Closes; selects only with `autoSelectOnTab` |
| Space | Types a space | Types a space |

Filtering is diacritic- and case-insensitive. Filtered-out items stay registered but render nothing, and a group with no match hides itself. During IME composition, keys and filtering wait for the composition to end. The server renders the select-only markup, and the first client effect switches to combobox semantics.

### Notes

- Items register while the popover is mounted. Until it opens, a selected value has no label: pass `itemToString`, or set `forceMount` on `Popover` to keep the items registered (this also lets type-ahead work while closed).
- `Popover` stays mounted with `data-state="closed"` until its CSS exit animation finishes, so animate with plain CSS.
- Escape and outside presses go through Overlay's shared layer stack. A Select inside an Overlay `Dialog` closes first on Escape. Inside a modal Dialog, set `portal={false}` (or portal into the dialog content), because a modal marks other body children inert.
- `Clear` and `Indicator` must not sit inside `Trigger`, and `Item`, `Group`, and `Empty` must sit inside `List`; development builds warn otherwise.
- Values are strings. Items live in the markup and are re-read with `refresh()`; the popover hides immediately on close, so it has no exit animation.

## Status

`NativeSelect`, `Select`, and combobox search (`Select.Input`) are available. Multiple selection and async loading land in later releases, so the package also exports only the Overlay types below.

| Export | From |
| --- | --- |
| `DismissReason` (type) | `@zealakit/overlay-vanilla` |
| `Placement` (type) | `@zealakit/overlay-vanilla` |

## Agent Skill

- [Omniselect Vanilla](https://github.com/zealakit/omniselect/blob/main/skills/omniselect-vanilla.md) — install and import rules for Vanilla.

## License

MIT © Zealakit
