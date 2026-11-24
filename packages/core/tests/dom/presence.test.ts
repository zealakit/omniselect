import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForExit } from "../../dist/dom/index.js";

/**
 * `[OS-PRES-n]` — the semantic base plan 06 diffs against notice's
 * implementation before extracting `/presence` into the engine (A.9, X14).
 */

function element(): HTMLElement {
  const node = document.createElement("div");
  document.body.append(node);
  return node;
}

test("[OS-PRES-1] resolves when nothing animates", async () => {
  const node = element();
  // happy-dom has getAnimations() and reports none, so this settles without
  // waiting for the safety timeout.
  const started = Date.now();
  await waitForExit(node, { timeout: 500 });
  assert.ok(Date.now() - started < 200, "settled promptly");
});

test("[OS-PRES-2] resolves immediately when no animation runs", async () => {
  const node = element();
  // happy-dom reports no running animations, so the promise settles at once.
  await Promise.race([
    waitForExit(node, { timeout: 500 }),
    new Promise((resolve) => setTimeout(resolve, 100)),
  ]);
});

test("[OS-PRES-3] resolves on animationend when the element still has motion", async () => {
  const node = element();
  // Simulate the fallback path: no getAnimations, but a non-zero duration.
  const proto = Object.getPrototypeOf(node) as { getAnimations?: unknown };
  const originalAnimations = proto.getAnimations;
  proto.getAnimations = undefined;
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () =>
    ({ animationDuration: "0.2s", transitionDuration: "0s" }) as CSSStyleDeclaration;

  try {
    const settled = waitForExit(node, { timeout: 500 });
    node.dispatchEvent(new window.Event("animationend"));
    await settled;
  } finally {
    globalThis.getComputedStyle = original;
    proto.getAnimations = originalAnimations;
    node.remove();
  }
});

test("[OS-PRES-4] the timeout is a safety net, not the normal path", async () => {
  const node = element();
  const proto = Object.getPrototypeOf(node) as { getAnimations?: unknown };
  const originalAnimations = proto.getAnimations;
  proto.getAnimations = undefined;
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () =>
    ({ animationDuration: "0.2s", transitionDuration: "0s" }) as CSSStyleDeclaration;

  try {
    const started = Date.now();
    // No animationend: the timeout resolves it.
    await waitForExit(node, { timeout: 30 });
    assert.ok(Date.now() - started < 200, "resolved by the timeout, not by a deadlock");
  } finally {
    globalThis.getComputedStyle = original;
    proto.getAnimations = originalAnimations;
    node.remove();
  }
});
