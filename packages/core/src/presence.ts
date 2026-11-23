/**
 * Resolve once every CSS animation/transition running on `element` has
 * finished (or after a safety timeout). Used to keep a popover mounted with
 * `data-state="closed"` until its exit animation ends.
 *
 * `getAnimations()` covers CSS animations, transitions and WAAPI. Browsers
 * without it fall back to `animationend`/`transitionend`.
 */
export function waitForExit(element: Element, options: { timeout?: number } = {}): Promise<void> {
  const timeout = options.timeout ?? 1000;
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };
    const timer = setTimeout(done, timeout);
    const getAnimations = (element as Element & { getAnimations?: () => Animation[] })
      .getAnimations;
    if (typeof getAnimations === "function") {
      const running = getAnimations.call(element);
      if (running.length === 0) {
        done();
        return;
      }
      void Promise.all(running.map((a) => a.finished.catch(() => undefined))).then(done);
      return;
    }
    const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
    const hasMotion =
      style !== null &&
      (parseFloat(style.animationDuration || "0") > 0 ||
        parseFloat(style.transitionDuration || "0") > 0);
    if (!hasMotion) {
      done();
      return;
    }
    element.addEventListener("animationend", done, { once: true });
    element.addEventListener("transitionend", done, { once: true });
  });
}
