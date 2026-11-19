import { Window } from "happy-dom";

/**
 * Register a DOM for vanilla adapter tests before they import the built
 * package. Core itself never needs browser globals at import time.
 */
const window = new Window({ url: "http://localhost/" });

const globals = globalThis as unknown as Record<string, unknown>;
globals.window = window;
globals.document = window.document;
globals.Element = window.Element;
globals.HTMLElement = window.HTMLElement;
globals.Node = window.Node;
globals.CustomEvent = window.CustomEvent;
globals.KeyboardEvent = window.KeyboardEvent;
globals.getComputedStyle = window.getComputedStyle.bind(window);

globals.HTMLSelectElement = window.HTMLSelectElement;
globals.HTMLOptionElement = window.HTMLOptionElement;
globals.HTMLFormElement = window.HTMLFormElement;
globals.FormData = window.FormData;
globals.Event = window.Event;
globals.MouseEvent = window.MouseEvent;
globals.FocusEvent = window.FocusEvent;
globals.HTMLButtonElement = window.HTMLButtonElement;
globals.HTMLDivElement = window.HTMLDivElement;
globals.HTMLSpanElement = window.HTMLSpanElement;
globals.PointerEvent = window.PointerEvent;
globals.MutationObserver = window.MutationObserver;
globals.ResizeObserver = window.ResizeObserver;
globals.HTMLInputElement = window.HTMLInputElement;
