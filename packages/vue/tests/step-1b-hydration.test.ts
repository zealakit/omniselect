import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp, h, nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { NativeSelect, Select } from "../dist/index.js";

/**
 * `[NQ11]` Vue hydration: a client that starts after other ids were handed out
 * must produce the ids the server rendered.
 */

function surface(root: ParentNode): string {
  return [...root.querySelectorAll("*")]
    .map((element) => {
      const attrs = [...element.attributes]
        .filter(
          (attribute) =>
            attribute.name === "id" ||
            attribute.name === "for" ||
            attribute.name.startsWith("aria-"),
        )
        .map((attribute) => `${attribute.name}=${attribute.value}`)
        .sort()
        .join(",");
      return `${element.tagName}:${attrs}`;
    })
    .join("|");
}

const make = () =>
  createSSRApp({
    render: () =>
      h("div", [
        h(Select.Root, null, {
          default: () => [
            h(Select.Trigger, null, { default: () => "Choose" }),
            h(Select.Popover, null, {
              default: () =>
                h(Select.List, null, {
                  default: () =>
                    h(Select.Group, null, {
                      default: () => h(Select.GroupLabel, null, { default: () => "Fruit" }),
                    }),
                }),
            }),
          ],
        }),
        h(NativeSelect.Root, null, {
          default: () => [
            h(NativeSelect.Label, null, { default: () => "Size" }),
            h(NativeSelect.Control),
          ],
        }),
      ]),
  });

test("[NQ11] Vue: ids are identical between the server render and hydration", async () => {
  const container = document.createElement("div");
  container.innerHTML = await renderToString(make());
  document.body.append(container);
  const server = surface(container);
  assert.match(server, /id=/);

  const messages: string[] = [];
  const { error, warn } = console;
  console.error = (...args: unknown[]) => messages.push(String(args[0]));
  console.warn = (...args: unknown[]) => messages.push(String(args[0]));
  const app = make();
  try {
    app.mount(container);
    await nextTick();
    await nextTick();
  } finally {
    console.error = error;
    console.warn = warn;
  }
  const client = surface(container);
  app.unmount();
  container.remove();

  assert.deepEqual(
    messages.filter((message) => /hydrat|mismatch/i.test(message)),
    [],
  );
  assert.equal(client, server);
});
