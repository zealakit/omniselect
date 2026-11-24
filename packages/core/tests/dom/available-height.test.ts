import assert from "node:assert/strict";
import { test } from "node:test";
import { availableHeight } from "../../dist/dom/index.js";

/**
 * `[OS-POP-3]` — available height from the engine position result (D11: the
 * engine ships no `size` middleware, so the package computes this).
 */

const rect = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
  top: y,
  bottom: y + height,
  left: x,
  right: x + width,
});

function result(placement: string, referenceTop: number, referenceBottom: number) {
  return {
    placement: placement as never,
    rects: {
      reference: rect(0, referenceTop, 100, referenceBottom - referenceTop),
      floating: rect(0, 0, 100, 50),
    },
  };
}

test("[OS-POP-3] bottom placement uses the room below minus gap and padding", () => {
  const height = availableHeight(result("bottom-start", 100, 140), 800, { gap: 4, padding: 8 });
  assert.equal(height, 800 - 140 - 4 - 8);
});

test("[OS-POP-3] top placement uses the room above", () => {
  const height = availableHeight(result("top", 300, 340), 800, { gap: 4, padding: 8 });
  assert.equal(height, 300 - 4 - 8);
});

test("[OS-POP-3] a flipped placement reports the other side's room", () => {
  const top = availableHeight(result("bottom", 700, 740), 800, { gap: 4, padding: 8 });
  const flipped = availableHeight(result("top", 700, 740), 800, { gap: 4, padding: 8 });
  assert.equal(top, 800 - 740 - 4 - 8);
  assert.equal(flipped, 700 - 4 - 8);
});

test("[OS-POP-3] side placements fall back to the viewport height", () => {
  assert.equal(availableHeight(result("right", 100, 140), 800, { padding: 8 }), 800 - 16);
});

test("[OS-POP-3] never returns a negative height", () => {
  assert.equal(availableHeight(result("bottom-start", 0, 790), 800, { gap: 4, padding: 8 }), 0);
});
