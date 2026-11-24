export type FilterItem<T> = { value: T; textValue: string };

/** Return `true` to keep the item for `query`. */
export type FilterFn<T> = (item: FilterItem<T>, query: string) => boolean;

/** NFD, strip combining marks, lowercase, trim. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/đ/g, "d").trim();
}

/** Diacritic- and case-insensitive "contains". An empty query matches all. */
export function defaultFilter<T>(item: FilterItem<T>, query: string): boolean {
  const needle = normalize(query);
  if (needle === "") {
    return true;
  }
  return normalize(item.textValue).includes(needle);
}
