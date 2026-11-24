# Migration guide — omniselect 1.0.0 (engine, no overlay)

Omniselect `1.0.0-beta.1` float the listbox on `@zealakit/ui-engine` (decision X4) instead of the
published `@zealakit/overlay-*` adapters. The component API is unchanged; the peer, some
re-exports and two behaviours changed.

## 1. Install the engine as a peer

```bash
npm i @zealakit/ui-engine @zealakit/omniselect-react
```

- `@zealakit/ui-engine` is a **peer** (`^1.0.0-beta.1`): install it once per app so every Zealakit
  package shares one layer stack and one live region.
- **Remove `@zealakit/overlay-*`** if omniselect was the only package that needed it. No
  omniselect adapter depends on overlay any more, and there is no `@zealakit/overlay-core` in the
  graph.

## 2. Re-exports that moved

| Before | After |
| --- | --- |
| `DismissReason` re-exported from `@zealakit/overlay-<fw>` | `SelectDismissReason` (omniselect's own four reasons). `DismissReason` still exists as a **deprecated alias** of it, so `import type { DismissReason }` keeps compiling |
| `Placement` re-exported from overlay | `Placement` from `@zealakit/ui-engine/position` (unchanged import path for you: the adapter still re-exports the type) |
| `Animation*` types | Still re-exported where they existed, but no omniselect prop uses them. Exit animation is CSS-only |

## 3. Behaviour changes

- **Generated ids** are `zealakit-omniselect-N` instead of `omniselect-N`. `aria-controls` and
  `aria-activedescendant` still point at the right elements.
- **Announcements** (multiple mode) go through the engine's one polite live region instead of a
  region inside each Select. The `data-part="live-region"` element is still rendered but is empty
  and deprecated; messages now clear after 7 s. If you styled or queried that element, stop.
- **Escape and outside presses** are decided by the engine's layer stack. One Escape closes one
  layer — a Select inside an overlay Dialog (once overlay is on the engine too) closes first, and
  a press inside the Dialog but outside the Select closes only the Select.
- **Accent folding** now includes Vietnamese `đ` everywhere (filter and typeahead), matching every
  other Zealakit package: `"dau"` matches `"Đậu"`.

## 4. What did not change

- The public component and prop surface (`Select.Root/Control/Trigger/Value/Popover/List/Item/…`,
  `NativeSelect`, `useNumberInput`-style hooks where present).
- `closeOnSelect`, `openOnFocus`, `openOnInput`, `selectionBehavior`, `loop`, `matchWidth`,
  `portal`, `placement`, `offset` and the rest of the props.
- CSS-only exit animation: the popover is hidden synchronously when nothing animates and waits for
  `animationend`/`transitionend` when something does.

## 5. Verify your app

1. `npm ls @zealakit/overlay-core` prints nothing.
2. `npm ls @zealakit/ui-engine` prints exactly one copy.
3. Keyboard: open the Select, press Escape once — only the Select closes.
4. Screen reader: multi-select add/remove is still announced once per change.
