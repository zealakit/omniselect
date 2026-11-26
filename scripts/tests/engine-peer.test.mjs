import assert from "node:assert/strict";
import { test } from "node:test";
import { expectedEnginePeer } from "../lib/engine-peer.mjs";

test("[X23] an /internal importer pins the exact beta, not a tilde range", () => {
  assert.equal(expectedEnginePeer(true), "1.0.0-beta.1");
  assert.notEqual(expectedEnginePeer(true), "~1.0.0-beta.1");
});

test("[X23] a public-entry importer keeps the caret range", () => {
  assert.equal(expectedEnginePeer(false), "^1.0.0-beta.1");
});
