<script lang="ts">
import {
  createLoadMoreGuard,
  findScrollParent,
} from "@zealakit/omniselect-core";
import { onDestroy, untrack, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { getSelectContext } from "./context.js";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** A page is being fetched. Blocks duplicate requests. */
  isLoading: boolean;
  /** More pages exist. */
  hasMore: boolean;
  /** Fetch the next page. Called once per scroll-to-end, never while loading. */
  onLoadMore: () => void;
  /** Prefetch distance around the scroll container. */
  rootMargin?: string;
  children?: Snippet;
};
let {
  isLoading,
  hasMore,
  onLoadMore,
  rootMargin = "0px 0px 64px 0px",
  children,
  ...rest
}: Props = $props();

const { machine, snapshot } = getSelectContext("LoadMore");
const guard = createLoadMoreGuard();
let element: HTMLDivElement | undefined = $state();
let observer: IntersectionObserver | null = null;
const open = $derived.by(() => {
  void $snapshot;
  return machine.isOpen();
});
// Re-measure when items change: a short page may leave the sentinel in view.
const version = $derived.by(() => {
  void $snapshot;
  return machine.collection.version();
});

$effect(() => {
  guard.sync({ open, hasMore, isLoading, onLoadMore });
});
$effect(() => machine.registerLoadMore({ request: () => guard.request() }));
$effect(() => {
  machine.setLoading(isLoading);
  return () => machine.setLoading(false);
});
$effect(() => {
  observer?.disconnect();
  observer = null;
  const el = element;
  if (!open || !el || typeof IntersectionObserver === "undefined") return;
  const created = new IntersectionObserver(
    (entries) => {
      const last = entries[entries.length - 1];
      if (last) guard.setIntersecting(last.isIntersecting);
    },
    {
      root: findScrollParent(el, el.closest('[data-part="popover"]')),
      rootMargin,
    },
  );
  created.observe(el);
  observer = created;
  return () => {
    created.disconnect();
    if (observer === created) observer = null;
  };
});
// observe() reports the current state again: loads the next page when the sentinel is still visible.
$effect(() => {
  void version;
  const loading = isLoading;
  untrack(() => {
    if (observer && element && !loading) {
      observer.unobserve(element);
      observer.observe(element);
    }
  });
});
onDestroy(() => guard.destroy());
</script>

<div
  data-part="load-more"
  data-loading={isLoading ? "" : undefined}
  data-has-more={hasMore ? "" : undefined}
  {...rest}
  aria-hidden="true"
  bind:this={element}
>
  {@render children?.()}
</div>
