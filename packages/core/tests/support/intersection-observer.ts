type Callback = (
  entries: { target: Element; isIntersecting: boolean }[],
  observer: unknown,
) => void;

/**
 * Controllable `IntersectionObserver`. Like the real one, `observe()` reports
 * the target's current state asynchronously, which is what the re-observe
 * trick after a loaded page relies on.
 */
export class MockIntersectionObserver {
  static instances = new Set<MockIntersectionObserver>();
  static state = new WeakMap<Element, boolean>();
  readonly options: { root?: Element | null; rootMargin?: string };
  private readonly callback: Callback;
  private readonly targets = new Set<Element>();

  constructor(callback: Callback, options: { root?: Element | null; rootMargin?: string } = {}) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.add(this);
  }

  observe(element: Element): void {
    this.targets.add(element);
    queueMicrotask(() => {
      if (this.targets.has(element)) {
        this.fire(element);
      }
    });
  }

  unobserve(element: Element): void {
    this.targets.delete(element);
  }

  disconnect(): void {
    this.targets.clear();
    MockIntersectionObserver.instances.delete(this);
  }

  takeRecords(): [] {
    return [];
  }

  private fire(element: Element): void {
    this.callback(
      [
        {
          target: element,
          isIntersecting: MockIntersectionObserver.state.get(element) ?? false,
        },
      ],
      this,
    );
  }

  /** Set the intersection of `element` and notify every observer watching it. */
  static setIntersecting(element: Element, value: boolean): void {
    MockIntersectionObserver.state.set(element, value);
    for (const observer of MockIntersectionObserver.instances) {
      if (observer.targets.has(element)) {
        observer.fire(element);
      }
    }
  }
}

export function installIntersectionObserver(): void {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
}
