/**
 * Private DOM helpers (`src/dom/`, D27/D35).
 *
 * Nothing here is part of a published package's `exports`: a public adapter
 * imports this entry only through its own bundled copy of Core, and the entry
 * never appears in `@zealakit/omniselect-*`'s `exports` (guarded by
 * `check:dom-private`). A module here may later move into
 * `@zealakit/ui-engine` when a second package needs the same semantics.
 */
export { waitForExit } from "./presence.js";
