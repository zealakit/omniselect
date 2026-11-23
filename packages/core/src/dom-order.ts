import type { CollectionItem } from "./collection.js";

/**
 * Document-order comparator for collections whose items carry a DOM `node`.
 * Items without a node keep their relative order (comparator returns 0).
 */
export function compareDomOrder<T>(a: CollectionItem<T>, b: CollectionItem<T>): number {
  const left = a.node as Node | undefined;
  const right = b.node as Node | undefined;
  if (!left || !right || left === right) {
    return 0;
  }
  const position = left.compareDocumentPosition(right);
  if (position & 4 /* DOCUMENT_POSITION_FOLLOWING */) {
    return -1;
  }
  if (position & 2 /* DOCUMENT_POSITION_PRECEDING */) {
    return 1;
  }
  return 0;
}
