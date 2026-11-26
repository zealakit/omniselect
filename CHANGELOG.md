# Changelog

Versions are chosen by the maintainer at release time; no agent publishes or bumps (D23). This
file records what changed while the branch runs against the local `@zealakit/ui-engine`
`1.0.0-beta.1`.

## Unreleased (engine — X4, folded into 1.0.0)

### Breaking

- **`@zealakit/ui-engine` is a required peer.** Install it once per app. No adapter depends on
  `@zealakit/overlay-*` any more; if omniselect was your only reason to install overlay, remove it.
- `DismissReason` is no longer overlay's type. Use `SelectDismissReason` (the same four reasons);
  the old name stays as a deprecated alias of it, so existing imports keep compiling.
- Generated ids are `zealakit-omniselect-N` instead of `omniselect-N` (relations unchanged).

### Fixed

- The vanilla Select's popover is positioned with `position: fixed` and appears next to its trigger (before, it sat in normal flow at the end of the document); a closed list and filtered-out items are no longer left visible.

### Changed

- The listbox floats on the engine's layer stack and `/position` (X4): one Escape closes one
  layer, an outside press walks the layer chain, and a Select inside an overlay Dialog stops
  closing both at once once overlay is on the engine too.
- Multiple-mode announcements use the engine's one polite live region instead of a per-Select
  region. `data-part="live-region"` is still rendered, but empty and deprecated; messages clear
  after 7 s.
- Accent folding includes Vietnamese `đ` everywhere, so `"dau"` matches `"Đậu"`.
- Bundle size went **down**: select entries are 10.1 kB (vanilla), 11.6 kB (React), 11.4 kB (Vue)
  and 13.4 kB (Svelte) gzip, all under the committed budgets, with the engine as an external peer.

### Removed

- Every `@zealakit/overlay-*` dependency, import and public type re-export.
- `getGlobalState` from `@zealakit/omniselect-core` (it is private, but the export is gone): the
  package keeps no page-global state; ids, live regions and layers belong to the engine.

### Migration

See [MIGRATION.md](./MIGRATION.md).
