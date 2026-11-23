import type { Action } from "svelte/action";

export type PortalParams = {
  /** CSS selector or element. Defaults to `document.body`. */
  target?: string | Element | null;
  disabled?: boolean;
};

/**
 * `use:portal` — move the node into a target for its lifetime.
 *
 * Unlike a restoring portal, this one does not put the node back on destroy.
 * Svelte removes an `{#if}` branch's DOM before it destroys the actions, so a
 * restoring portal would re-insert the removed node and leave a ghost behind.
 */
export const portal: Action<HTMLElement, PortalParams | undefined> = (node, params) => {
  let current = params;
  const resolve = (): Element | null => {
    const target = current?.target;
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target ?? document.body;
  };
  const move = () => {
    if (current?.disabled) {
      return;
    }
    const target = resolve();
    if (target && node.parentElement !== target) {
      target.appendChild(node);
    }
  };
  move();
  return {
    update(next) {
      current = next;
      move();
    },
    destroy() {
      node.remove();
    },
  };
};
