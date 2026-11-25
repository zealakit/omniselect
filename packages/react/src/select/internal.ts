import type { Attrs, SelectMachine } from "@zealakit/omniselect-core";
import { useSyncExternalStore } from "react";

/**
 * Re-render only when `select(machine)` returns a different primitive. Parts
 * compute the string from machine state and then ask the machine for attrs.
 */
export function useSnapshot<T>(
  machine: SelectMachine<T>,
  select: (m: SelectMachine<T>) => string,
): string {
  const read = () => select(machine);
  return useSyncExternalStore(machine.store.subscribe, read, read);
}

const renamed: Record<string, string> = {
  tabindex: "tabIndex",
  autocomplete: "autoComplete",
  spellcheck: "spellCheck",
};

/** Turn a machine attribute map into React props (drops `undefined`, fixes casing). */
export function reactAttrs(attrs: Attrs): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      out[renamed[name] ?? name] = value;
    }
  }
  return out;
}
