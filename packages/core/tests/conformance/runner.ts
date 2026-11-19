import assert from "node:assert/strict";
import { test } from "node:test";
import type { Driver, Expectation, Mounted, Scenario } from "./types.ts";

function check(mounted: Mounted, expect: Expectation, where: string): void {
  for (const [ref, attrs] of Object.entries(expect.attrs ?? {})) {
    const el = mounted.query(ref);
    assert.ok(el, `${where}: part "${ref}" is not mounted`);
    for (const [name, want] of Object.entries(attrs)) {
      assert.equal(el.getAttribute(name), want, `${where}: ${ref}[${name}]`);
    }
  }
  if (expect.active !== undefined) {
    const active = document.activeElement;
    if (expect.active === null) {
      const el = active && active !== document.body ? active : null;
      assert.equal(el, null, `${where}: expected no active part`);
    } else {
      assert.equal(
        active,
        mounted.query(expect.active),
        `${where}: active part should be ${expect.active}`,
      );
    }
  }
  for (const ref of expect.present ?? []) {
    assert.ok(mounted.query(ref), `${where}: "${ref}" should be present`);
  }
  for (const ref of expect.absent ?? []) {
    assert.equal(
      mounted.query(ref),
      null,
      `${where}: "${ref}" should be absent`,
    );
  }
  for (const [ref, text] of Object.entries(expect.text ?? {})) {
    assert.equal(
      mounted.query(ref)?.textContent?.trim(),
      text,
      `${where}: text of ${ref}`,
    );
  }
  if (expect.calls) {
    assert.deepEqual(mounted.calls(), expect.calls, `${where}: calls`);
  }
  if (expect.lastCall) {
    const all = mounted.calls();
    assert.deepEqual(
      all[all.length - 1],
      expect.lastCall,
      `${where}: last call`,
    );
  }
  if (expect.formData) {
    assert.deepEqual(mounted.formData(), expect.formData, `${where}: formData`);
  }
  if ("value" in expect) {
    assert.deepEqual(mounted.value(), expect.value, `${where}: value`);
  }
  if (expect.visibleItems) {
    assert.deepEqual(
      mounted.visibleItems(),
      expect.visibleItems,
      `${where}: visible items`,
    );
  }
}

/** Run every scenario against one adapter driver, one `node:test` case each. */
export function runConformance(
  adapter: string,
  driver: Driver,
  scenarios: readonly Scenario[],
): void {
  for (const scenario of scenarios) {
    const skip =
      scenario.skip?.[adapter as keyof NonNullable<Scenario["skip"]>];
    test(`[${adapter}] ${scenario.name}`, { skip }, async () => {
      const mounted = await driver.mount(scenario);
      try {
        let index = 0;
        for (const step of scenario.steps) {
          index += 1;
          if (step.type === "expect") {
            check(mounted, step.expect, `step ${index}`);
          } else {
            await mounted.act(step);
          }
        }
      } finally {
        mounted.unmount();
      }
    });
  }
}
