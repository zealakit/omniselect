import {
  createLoadMoreGuard,
  findScrollParent,
  type LoadMoreGuard,
} from "@zealakit/omniselect-core";
import { forwardRef, type HTMLAttributes, useEffect, useRef } from "react";
import { useMergedRef } from "../internal/merge-refs.js";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect.js";
import { useSelectContext } from "./context.js";
import { useSnapshot } from "./internal.js";

export type SelectLoadMoreProps = HTMLAttributes<HTMLDivElement> & {
  /** A page is being fetched. Blocks duplicate requests. */
  isLoading: boolean;
  /** More pages exist. */
  hasMore: boolean;
  /** Fetch the next page. Called once per scroll-to-end, never while loading. */
  onLoadMore: () => void;
  /** Prefetch distance around the scroll container. Default `"0px 0px 64px 0px"`. */
  rootMargin?: string;
};

/**
 * Async pagination sentinel. Place it as the last child of `Select.List`; it
 * asks for the next page when it scrolls into view (or when the keyboard
 * reaches the last item). The library never fetches.
 */
export const LoadMore = forwardRef<HTMLDivElement, SelectLoadMoreProps>(function SelectLoadMore(
  { isLoading, hasMore, onLoadMore, rootMargin = "0px 0px 64px 0px", ...rest },
  ref,
) {
  const { machine } = useSelectContext("LoadMore");
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const guardRef = useRef<LoadMoreGuard | null>(null);
  if (guardRef.current === null) {
    guardRef.current = createLoadMoreGuard();
  }
  const guard = guardRef.current;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const open = useSnapshot(machine, (m) => String(m.isOpen())) === "true";
  // Re-measure when items change: a short page may leave the sentinel in view.
  const version = useSnapshot(machine, (m) => String(m.collection.version()));

  useIsomorphicLayoutEffect(() => {
    guard.sync({ open, hasMore, isLoading, onLoadMore });
  });
  useEffect(() => machine.registerLoadMore({ request: () => guard.request() }), [machine, guard]);
  useEffect(() => {
    machine.setLoading(isLoading);
    return () => machine.setLoading(false);
  }, [machine, isLoading]);
  useEffect(() => () => guard.destroy(), [guard]);

  useEffect(() => {
    const element = elementRef.current;
    if (!open || !element || typeof IntersectionObserver === "undefined") {
      return;
    }
    const root = findScrollParent(element, element.closest('[data-part="popover"]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) {
          guard.setIntersecting(last.isIntersecting);
        }
      },
      { root, rootMargin },
    );
    observer.observe(element);
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [open, rootMargin, guard]);

  // observe() reports the current state again: loads the next page when the sentinel is still visible.
  useEffect(() => {
    const element = elementRef.current;
    const observer = observerRef.current;
    if (observer && element && !isLoading) {
      observer.unobserve(element);
      observer.observe(element);
    }
  }, [isLoading, version]);

  return (
    <div
      data-part="load-more"
      data-loading={isLoading ? "" : undefined}
      data-has-more={hasMore ? "" : undefined}
      {...rest}
      aria-hidden="true"
      ref={mergedRef}
    />
  );
});
