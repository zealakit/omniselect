import { type Ref, type RefCallback, useMemo } from "react";

/** Combine several refs (callback or object) into one callback ref. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

/**
 * Stable merged ref. A new callback identity every render makes React call the
 * old ref with `null` and the new one with the node, which loops when a ref
 * sets state.
 */
export function useMergedRef<T>(
  ...refs: (Ref<T> | undefined)[]
): RefCallback<T> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs array is the dependency list
  return useMemo(() => mergeRefs(...refs), refs);
}
