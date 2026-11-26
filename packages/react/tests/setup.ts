import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { Window } from "happy-dom";

// The Overlay pilot is a `link:` dependency: pin React imports from it to this copy.
const requireFromHere = createRequire(import.meta.url);
const reactPackages: Record<string, string> = {};
for (const name of [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom/client",
]) {
  reactPackages[name] = pathToFileURL(requireFromHere.resolve(name)).href;
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = reactPackages[specifier];
    if (target && context.parentURL?.includes("/overlay/"))
      return { url: target, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

/**
 * Register a DOM before React and the adapter are imported. `--import` runs
 * this file ahead of every test module.
 */
const window = new Window({ url: "http://localhost/" });

const values: Record<string, unknown> = {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
  Node: window.Node,
  Document: window.Document,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  KeyboardEvent: window.KeyboardEvent,
  MouseEvent: window.MouseEvent,
  PointerEvent: window.PointerEvent,
  FocusEvent: window.FocusEvent,
  MutationObserver: window.MutationObserver,
  FormData: window.FormData,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLOptionElement: window.HTMLOptionElement,
  ResizeObserver: window.ResizeObserver,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
};

for (const [key, value] of Object.entries(values)) {
  try {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  } catch {
    // Some Node globals (for example `navigator`) may be non-configurable.
  }
}

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
