import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { Window } from "happy-dom";

// The Overlay pilot is a `link:` dependency: pin Svelte imports from it to this copy.
const requireFromHere = createRequire(import.meta.url);
const sveltePackages: Record<string, string> = {};
for (const name of [
  "svelte",
  "svelte/internal",
  "svelte/internal/client",
  "svelte/store",
  "svelte/reactivity",
]) {
  try {
    sveltePackages[name] = pathToFileURL(requireFromHere.resolve(name)).href;
  } catch {
    // Not every subpath is exported at run time.
  }
}

/** Register a DOM before the built adapter is imported. */
const window = new Window({ url: "http://localhost/" });

const values: Record<string, unknown> = {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
  SVGElement: window.SVGElement,
  Node: window.Node,
  Text: window.Text,
  Comment: window.Comment,
  DocumentFragment: window.DocumentFragment,
  Document: window.Document,
  HTMLTemplateElement: window.HTMLTemplateElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLButtonElement: window.HTMLButtonElement,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  KeyboardEvent: window.KeyboardEvent,
  MouseEvent: window.MouseEvent,
  PointerEvent: window.PointerEvent,
  FocusEvent: window.FocusEvent,
  MutationObserver: window.MutationObserver,
  FormData: window.FormData,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLOptionElement: window.HTMLOptionElement,
  HTMLFormElement: window.HTMLFormElement,
  HTMLOptGroupElement: window.HTMLOptGroupElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLMediaElement: window.HTMLMediaElement,
  HTMLLabelElement: window.HTMLLabelElement,
  HTMLSpanElement: window.HTMLSpanElement,
  HTMLDivElement: window.HTMLDivElement,
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
    // Some Node globals may be non-configurable.
  }
}

/** Compile `.svelte` files on import so tests can load the built components. */
registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = sveltePackages[specifier];
    if (target && context.parentURL?.includes("/overlay/"))
      return { url: target, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".svelte")) {
      const filename = fileURLToPath(url);
      const { js } = compile(readFileSync(filename, "utf8"), {
        generate: "client",
        filename,
        css: "injected",
      });
      return { format: "module", source: js.code, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
