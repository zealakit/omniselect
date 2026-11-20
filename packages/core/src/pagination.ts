export type LoadMoreState = {
  /** The popover is open. */
  open: boolean;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
};

export type LoadMoreGuard = {
  /** Push the latest props. Re-evaluates the trigger rule. */
  sync: (state: LoadMoreState) => void;
  /** The sentinel's intersection with the scroll container changed. */
  setIntersecting: (intersecting: boolean) => void;
  /** Ask for the next page without the sentinel (keyboard users reach the end). */
  request: () => boolean;
  destroy: () => void;
};

export type LoadMoreGuardOptions = {
  /**
   * If `isLoading` never turns `true` within this time after a request, the
   * loader is treated as instant and the request is considered done.
   */
  settleMs?: number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
};

/**
 * Duplicate-request guard for paginated loading.
 *
 * Trigger rule: `open && intersecting && hasMore && !isLoading && !inFlight`.
 * `inFlight` is set synchronously when `onLoadMore` is called and cleared when
 * `isLoading` goes from `true` to `false` (or after `settleMs` if it never
 * becomes `true`), so rapid intersection events never produce two requests.
 */
export function createLoadMoreGuard(
  options: LoadMoreGuardOptions = {},
): LoadMoreGuard {
  const settleMs = options.settleMs ?? 100;
  const schedule = options.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel =
    options.clearTimeout ?? ((handle) => clearTimeout(handle as never));
  let state: LoadMoreState = {
    open: false,
    hasMore: false,
    isLoading: false,
    onLoadMore: () => {},
  };
  let intersecting = false;
  let inFlight = false;
  let timer: unknown = null;

  const stopTimer = () => {
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
  };

  const call = (): boolean => {
    inFlight = true;
    stopTimer();
    timer = schedule(() => {
      timer = null;
      if (!state.isLoading) {
        inFlight = false;
        evaluate();
      }
    }, settleMs);
    state.onLoadMore();
    return true;
  };

  const canLoad = () =>
    state.open && state.hasMore && !state.isLoading && !inFlight;

  function evaluate(): void {
    if (intersecting && canLoad()) {
      call();
    }
  }

  return {
    sync(next) {
      const wasLoading = state.isLoading;
      state = next;
      if (next.isLoading) {
        stopTimer();
      }
      if (wasLoading && !next.isLoading) {
        inFlight = false;
      }
      if (!next.open) {
        intersecting = false;
        inFlight = false;
        stopTimer();
      }
      evaluate();
    },
    setIntersecting(next) {
      intersecting = next;
      evaluate();
    },
    request() {
      return canLoad() ? call() : false;
    },
    destroy: stopTimer,
  };
}

/** Nearest scrollable ancestor of `element` (up to and including `stopAt`), or `null` for the viewport. */
export function findScrollParent(
  element: Element,
  stopAt?: Element | null,
): Element | null {
  let node: Element | null = element.parentElement;
  while (node) {
    const overflow =
      typeof getComputedStyle === "function"
        ? getComputedStyle(node).overflowY
        : "";
    if (
      overflow === "auto" ||
      overflow === "scroll" ||
      overflow === "overlay"
    ) {
      return node;
    }
    if (node === stopAt) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Scroll the list (never the page) just enough to reveal `item`. The native
 * `scrollIntoView` also scrolls the page, which jumps to the top while the
 * popover is not positioned yet.
 */
export function scrollItemIntoView(item: Element): void {
  const container = findScrollParent(
    item,
    item.closest('[data-part="popover"]'),
  );
  if (!container) {
    return;
  }
  const box = container.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  if (rect.top < box.top) {
    container.scrollTop -= box.top - rect.top;
  } else if (rect.bottom > box.bottom) {
    container.scrollTop += rect.bottom - box.bottom;
  }
}
