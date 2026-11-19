export type NavItem = { key: string; disabled?: boolean };

const enabled = <I extends NavItem>(items: readonly I[]): I[] =>
  items.filter((item) => !item.disabled);

export function first<I extends NavItem>(items: readonly I[]): string | null {
  return enabled(items)[0]?.key ?? null;
}

export function last<I extends NavItem>(items: readonly I[]): string | null {
  const list = enabled(items);
  return list[list.length - 1]?.key ?? null;
}

export function next<I extends NavItem>(
  items: readonly I[],
  fromKey: string | null,
  options: { wrap?: boolean } = {},
): string | null {
  const list = enabled(items);
  if (list.length === 0) {
    return null;
  }
  const index = fromKey === null ? -1 : indexAmong(items, list, fromKey);
  if (index === -2) {
    return list[0]?.key ?? null;
  }
  if (index + 1 < list.length) {
    return list[index + 1]?.key ?? null;
  }
  return options.wrap ? (list[0]?.key ?? null) : (list[index]?.key ?? null);
}

export function prev<I extends NavItem>(
  items: readonly I[],
  fromKey: string | null,
  options: { wrap?: boolean } = {},
): string | null {
  const list = enabled(items);
  if (list.length === 0) {
    return null;
  }
  if (fromKey === null) {
    return list[list.length - 1]?.key ?? null;
  }
  const index = indexAmong(items, list, fromKey);
  if (index === -2) {
    return list[list.length - 1]?.key ?? null;
  }
  if (index - 1 >= 0) {
    return list[index - 1]?.key ?? null;
  }
  return options.wrap
    ? (list[list.length - 1]?.key ?? null)
    : (list[0]?.key ?? null);
}

export function pageDown<I extends NavItem>(
  items: readonly I[],
  fromKey: string | null,
  pageSize = 10,
): string | null {
  const list = enabled(items);
  if (list.length === 0) {
    return null;
  }
  const index = fromKey === null ? -1 : indexAmong(items, list, fromKey);
  const start = index === -2 ? -1 : index;
  return list[Math.min(list.length - 1, start + pageSize)]?.key ?? null;
}

export function pageUp<I extends NavItem>(
  items: readonly I[],
  fromKey: string | null,
  pageSize = 10,
): string | null {
  const list = enabled(items);
  if (list.length === 0) {
    return null;
  }
  const index = fromKey === null ? 0 : indexAmong(items, list, fromKey);
  const start = index === -2 ? 0 : index;
  return list[Math.max(0, start - pageSize)]?.key ?? null;
}

/**
 * Index of `fromKey` within the enabled list. When `fromKey` is a disabled
 * item, the nearest enabled item before it. `-2` when the key is not listed.
 */
function indexAmong<I extends NavItem>(
  all: readonly I[],
  list: readonly I[],
  fromKey: string,
): number {
  const position = all.findIndex((item) => item.key === fromKey);
  if (position === -1) {
    return -2;
  }
  let count = -1;
  for (let i = 0; i <= position; i += 1) {
    if (!all[i]?.disabled) {
      count += 1;
    }
  }
  return Math.min(count, list.length - 1);
}
