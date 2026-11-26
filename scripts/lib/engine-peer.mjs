/** X23: the engine peer range a manifest must declare. */
/**
 * A package whose built output imports `/internal` pins the exact beta; a
 * package that imports only the public entry uses the caret range.
 */
export const expectedEnginePeer = (internal) =>
  internal ? "1.0.0-beta.1" : "^1.0.0-beta.1";
