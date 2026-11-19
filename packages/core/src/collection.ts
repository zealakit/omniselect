import { defaultFilter, type FilterFn } from "./filter.js";

export type CollectionItem<T> = {
  key: string;
  value: T;
  textValue: string;
  disabled: boolean;
  groupId: string | null;
  /** Adapter-owned element or handle. Used only by `compare`. */
  node?: unknown;
};

export type CollectionOptions<T> = {
  /** Document-order comparator. Defaults to registration order. */
  compare?: (a: CollectionItem<T>, b: CollectionItem<T>) => number;
};

export type ItemInput<T> = {
  key: string;
  value: T;
  textValue: string;
  disabled?: boolean;
  groupId?: string | null;
  node?: unknown;
};

export type Collection<T> = {
  register: (item: ItemInput<T>) => () => void;
  update: (key: string, patch: Partial<Omit<ItemInput<T>, "key">>) => void;
  registerGroup: (id: string, options?: { disabled?: boolean }) => () => void;
  /** All registered items in document order, group-disabled cascaded. */
  items: () => CollectionItem<T>[];
  /** Items passing the current filter, in order. */
  visible: () => CollectionItem<T>[];
  get: (key: string) => CollectionItem<T> | undefined;
  /** Set the live query. `false` = manual mode (nothing is filtered out). */
  setFilter: (query: string, filter?: FilterFn<T> | false) => void;
  /** Label cache: survives unregister so closed lists still show labels. */
  labelOf: (key: string, fallback?: (() => string) | undefined) => string;
  /** Monotonic counter bumped on every structural or filter change. */
  version: () => number;
  subscribe: (listener: () => void) => () => void;
};

export function createCollection<T>(
  options: CollectionOptions<T> = {},
): Collection<T> {
  const entries = new Map<string, CollectionItem<T>>();
  const order: string[] = [];
  const groups = new Map<string, { disabled: boolean }>();
  const labels = new Map<string, string>();
  const listeners = new Set<() => void>();
  let version = 0;
  let query = "";
  let filter: FilterFn<T> | false = defaultFilter;
  let cache: {
    v: number;
    items: CollectionItem<T>[];
    visible: CollectionItem<T>[];
    byKey: Map<string, CollectionItem<T>>;
  } | null = null;

  const bump = (): void => {
    version += 1;
    cache = null;
    for (const listener of [...listeners]) {
      listener();
    }
  };

  const resolve = () => {
    if (cache && cache.v === version) {
      return cache;
    }
    const base = order
      .map((key) => entries.get(key))
      .filter((item): item is CollectionItem<T> => item !== undefined)
      .map((item) => ({
        ...item,
        disabled:
          item.disabled ||
          (item.groupId !== null &&
            groups.get(item.groupId)?.disabled === true),
      }));
    const compare = options.compare;
    const items = compare ? [...base].sort(compare) : base;
    const visible =
      filter === false
        ? items
        : items.filter((item) => (filter as FilterFn<T>)(item, query));
    cache = {
      v: version,
      items,
      visible,
      byKey: new Map(items.map((item) => [item.key, item])),
    };
    return cache;
  };

  return {
    register(input) {
      const item: CollectionItem<T> = {
        key: input.key,
        value: input.value,
        textValue: input.textValue,
        disabled: input.disabled ?? false,
        groupId: input.groupId ?? null,
        node: input.node,
      };
      if (!entries.has(input.key)) {
        order.push(input.key);
      }
      entries.set(input.key, item);
      labels.set(input.key, input.textValue);
      bump();
      return () => {
        if (entries.get(input.key) === item) {
          entries.delete(input.key);
          const at = order.indexOf(input.key);
          if (at !== -1) {
            order.splice(at, 1);
          }
          bump();
        }
      };
    },
    update(key, patch) {
      const current = entries.get(key);
      if (!current) {
        return;
      }
      const next = { ...current, ...patch, key } as CollectionItem<T>;
      entries.set(key, next);
      if (patch.textValue !== undefined) {
        labels.set(key, patch.textValue);
      }
      bump();
    },
    registerGroup(id, groupOptions) {
      groups.set(id, { disabled: groupOptions?.disabled ?? false });
      bump();
      return () => {
        groups.delete(id);
        bump();
      };
    },
    items: () => resolve().items,
    visible: () => resolve().visible,
    get: (key) => resolve().byKey.get(key),
    setFilter(nextQuery, nextFilter) {
      query = nextQuery;
      filter = nextFilter === undefined ? defaultFilter : nextFilter;
      bump();
    },
    labelOf: (key, fallback) => labels.get(key) ?? fallback?.() ?? key,
    version: () => version,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
