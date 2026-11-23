import { normalize } from "./filter.js";

export type TypeaheadItem = {
  key: string;
  textValue: string;
  disabled?: boolean;
};

export type Typeahead = {
  /** Feed one printable character; returns the key to move to, or `null`. */
  onKey: (
    char: string,
    items: readonly TypeaheadItem[],
    currentKey: string | null,
  ) => string | null;
  /** `true` while a search buffer is still live (Space belongs to the query). */
  hasBuffer: () => boolean;
  reset: () => void;
};

export function createTypeahead(options: { timeout?: number; now?: () => number } = {}): Typeahead {
  const timeout = options.timeout ?? 500;
  const now = options.now ?? (() => Date.now());
  let buffer = "";
  let lastAt = Number.NEGATIVE_INFINITY;

  const expire = (): void => {
    if (now() - lastAt > timeout) {
      buffer = "";
    }
  };

  return {
    onKey(char, items, currentKey) {
      expire();
      buffer += normalize(char);
      lastAt = now();
      const candidates = items.filter((item) => !item.disabled);
      if (candidates.length === 0) {
        return null;
      }
      const repeated = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
      const query = repeated ? (buffer[0] as string) : buffer;
      const currentIndex = candidates.findIndex((i) => i.key === currentKey);
      // Cycling (single repeated char) starts after the current item; growing
      // queries may keep the current item if it still matches.
      const start = repeated || buffer.length === 1 ? currentIndex + 1 : Math.max(currentIndex, 0);
      for (let step = 0; step < candidates.length; step += 1) {
        const item = candidates[(start + step) % candidates.length];
        if (item && normalize(item.textValue).startsWith(query)) {
          return item.key;
        }
      }
      return null;
    },
    hasBuffer() {
      expire();
      return buffer !== "";
    },
    reset() {
      buffer = "";
      lastAt = Number.NEGATIVE_INFINITY;
    },
  };
}
