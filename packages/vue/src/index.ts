export * from "./native/index.js";
export * from "./select/index.js";
/**
 * The dismissal reasons omniselect emits.
 *
 * @deprecated Import `SelectDismissReason` from the adapter itself. This alias no
 * longer comes from overlay: the listbox floats on the engine (X4).
 */
export type DismissReason = SelectDismissReason;
export type SelectDismissReason = "escape-key" | "outside-press" | "reference-press" | "imperative";
export type { Placement } from "@zealakit/ui-engine/position";
