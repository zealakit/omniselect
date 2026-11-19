import {
  createLoadMoreGuard,
  findScrollParent,
} from "@zealakit/omniselect-core";
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from "vue";
import { useSelectContext } from "./context.js";

/**
 * Async pagination sentinel. Place it as the last child of `Select.List`; it
 * asks for the next page (`@load-more`) when it scrolls into view or when the
 * keyboard reaches the last item. The library never fetches.
 */
export const LoadMore = defineComponent({
  name: "SelectLoadMore",
  props: {
    /** A page is being fetched. Blocks duplicate requests. */
    isLoading: { type: Boolean, default: false },
    /** More pages exist. */
    hasMore: { type: Boolean, default: false },
    /** Prefetch distance around the scroll container. */
    rootMargin: { type: String, default: "0px 0px 64px 0px" },
  },
  emits: { loadMore: () => true },
  setup(props, { slots, emit }) {
    const context = useSelectContext("LoadMore");
    const { machine } = context;
    const guard = createLoadMoreGuard();
    const element = shallowRef<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;
    const open = computed(() => {
      context.version.value;
      return machine.isOpen();
    });

    watch(
      [open, () => props.hasMore, () => props.isLoading],
      () =>
        guard.sync({
          open: open.value,
          hasMore: props.hasMore,
          isLoading: props.isLoading,
          onLoadMore: () => emit("loadMore"),
        }),
      { immediate: true, flush: "post" },
    );
    let offLoadMore: (() => void) | undefined;
    onMounted(() => {
      offLoadMore = machine.registerLoadMore({
        request: () => guard.request(),
      });
    });
    watch(
      () => props.isLoading,
      (loading) => machine.setLoading(loading),
      { immediate: true },
    );
    watch(
      [open, element, () => props.rootMargin],
      () => {
        observer?.disconnect();
        observer = null;
        const el = element.value;
        if (!open.value || !el || typeof IntersectionObserver === "undefined") {
          return;
        }
        observer = new IntersectionObserver(
          (entries) => {
            const last = entries[entries.length - 1];
            if (last) {
              guard.setIntersecting(last.isIntersecting);
            }
          },
          {
            root: findScrollParent(el, el.closest('[data-part="popover"]')),
            rootMargin: props.rootMargin,
          },
        );
        observer.observe(el);
      },
      { immediate: true, flush: "post" },
    );
    // observe() reports the current state again: loads the next page when the sentinel is still visible.
    watch(
      [() => props.isLoading, () => context.version.value],
      () => {
        const el = element.value;
        if (observer && el && !props.isLoading) {
          observer.unobserve(el);
          observer.observe(el);
        }
      },
      { flush: "post" },
    );
    onBeforeUnmount(() => {
      observer?.disconnect();
      offLoadMore?.();
      guard.destroy();
      machine.setLoading(false);
    });

    return () =>
      h(
        "div",
        {
          "data-part": "load-more",
          "data-loading": props.isLoading ? "" : undefined,
          "data-has-more": props.hasMore ? "" : undefined,
          "aria-hidden": "true",
          ref: element,
        },
        slots.default?.(),
      );
  },
});
