import { createId } from "@zealakit/ui-engine";

export type Ids = {
  root: string;
  label: string;
  trigger: string;
  input: string;
  listbox: string;
  item: (key: string) => string;
  group: (id: string) => string;
  groupLabel: (id: string) => string;
};

/** Make a key safe for `id` / `aria-activedescendant` (no spaces or `%`). */
export function encodeKey(key: string): string {
  return encodeURIComponent(key).replaceAll("%", "_");
}

export function createIds(rootId: string): Ids {
  return {
    root: rootId,
    label: `${rootId}-label`,
    trigger: `${rootId}-trigger`,
    input: `${rootId}-input`,
    listbox: `${rootId}-listbox`,
    item: (key) => `${rootId}-item-${encodeKey(key)}`,
    group: (id) => `${rootId}-group-${encodeKey(id)}`,
    groupLabel: (id) => `${rootId}-group-${encodeKey(id)}-label`,
  };
}

/**
 * Id source for adapters without a framework id primitive.
 *
 * X11: the engine owns the one page-wide counter, so ids never collide with
 * another Zealakit package or with a second bundled copy of Core. The format is
 * `zealakit-<prefix>-<n>`; framework adapters keep their own `useId()` for SSR.
 */
export function nextId(prefix = "omniselect"): string {
  return createId(prefix);
}
