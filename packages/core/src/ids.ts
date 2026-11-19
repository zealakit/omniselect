import { getGlobalState } from "./utils/global-state.js";

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

/** Page-global id source for adapters without a framework id primitive. */
export function nextId(prefix = "omniselect"): string {
  const counter = getGlobalState("ids", () => ({ value: 0 }));
  counter.value += 1;
  return `${prefix}-${counter.value}`;
}
