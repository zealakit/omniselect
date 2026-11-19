export type Listener<S> = (state: S) => void;

export type Store<S> = {
  /** Always-current state; safe to call synchronously. */
  get: () => S;
  /** Merge a partial state. No-op when every field is shallow-equal. */
  set: (patch: Partial<S> | ((state: S) => Partial<S>)) => void;
  subscribe: (listener: Listener<S>) => () => void;
  /** Group several `set` calls into one notification. */
  batch: (fn: () => void) => void;
};

/**
 * Minimal observable store. Notifications are synchronous after the outermost
 * `set` or `batch`, so state and listeners never disagree.
 */
export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener<S>>();
  let depth = 0;
  let dirty = false;

  function flush(): void {
    if (depth > 0 || !dirty) {
      return;
    }
    dirty = false;
    for (const listener of [...listeners]) {
      if (listeners.has(listener)) {
        listener(state);
      }
    }
  }

  function set(patch: Partial<S> | ((state: S) => Partial<S>)): void {
    const next = typeof patch === "function" ? patch(state) : patch;
    let changed = false;
    for (const key of Object.keys(next) as (keyof S)[]) {
      if (!Object.is(state[key], next[key])) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      return;
    }
    state = { ...state, ...next };
    dirty = true;
    flush();
  }

  function batch(fn: () => void): void {
    depth += 1;
    try {
      fn();
    } finally {
      depth -= 1;
      flush();
    }
  }

  return {
    get: () => state,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    batch,
  };
}
