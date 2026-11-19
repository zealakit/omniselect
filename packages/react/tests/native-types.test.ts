import { test } from "node:test";
import { createElement as h } from "react";
import { NativeSelect } from "../dist/native/index.js";

test("types: multiple narrows the onValueChange parameter", () => {
  h(NativeSelect.Root<string>, {
    multiple: true,
    onValueChange: (value: string[]) => value.length,
  });
  h(NativeSelect.Root<string>, {
    onValueChange: (value: string | null) => value,
  });
  // @ts-expect-error an array handler is not valid without `multiple`
  h(NativeSelect.Root<string>, { onValueChange: (value: string[]) => value });
});
