import assert from "node:assert/strict";
import { test } from "node:test";
import { createNativeSelect } from "../dist/native/index.js";
import { createSelect } from "../dist/select/index.js";

test("native: setInvalid toggles data-invalid and aria-invalid", () => {
  const root = document.createElement("div");
  root.innerHTML = '<label>L</label><select><option value="a">A</option></select>';
  document.body.append(root);
  const handle = createNativeSelect(root);
  const select = root.querySelector("select") as HTMLSelectElement;
  handle.setInvalid(true);
  assert.equal(select.getAttribute("data-invalid"), "");
  assert.equal(select.getAttribute("aria-invalid"), "true");
  handle.setInvalid(false);
  assert.equal(select.getAttribute("data-invalid"), null);
  assert.equal(select.getAttribute("aria-invalid"), null);
  handle.destroy();
  root.remove();
});

test("select: setInvalid toggles data-invalid and aria-invalid on the trigger", () => {
  const root = document.createElement("div");
  root.innerHTML =
    '<div data-part="control"><button data-part="trigger" type="button"></button></div><div data-part="popover"><div data-part="list"><div data-part="item" data-value="a">A</div></div></div>';
  document.body.append(root);
  const handle = createSelect(root);
  const trigger = root.querySelector("[data-part=trigger]") as HTMLElement;
  handle.setInvalid(true);
  assert.equal(trigger.getAttribute("data-invalid"), "");
  assert.equal(trigger.getAttribute("aria-invalid"), "true");
  handle.setInvalid(false);
  assert.equal(trigger.getAttribute("aria-invalid"), null);
  handle.destroy();
  root.remove();
});
