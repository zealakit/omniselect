/**
 * Type-only check, run by `pnpm typecheck` (never executed): a consumer must be
 * able to pass callbacks typed with its own value type to `Select.Root`.
 */
import { h } from "vue";
import { Select } from "../dist/select/index.js";

type User = { id: string; name: string };

export const typedCallbacks = h(Select.Root, {
  itemToKey: (user: User) => user.id,
  itemToString: (user: User) => user.name,
  filter: (user: User, query: string) => user.name.includes(query),
});

export const wrongReturnType = h(Select.Root, {
  // @ts-expect-error -- the key must still be a string
  itemToKey: (user: User) => user.id.length,
});
