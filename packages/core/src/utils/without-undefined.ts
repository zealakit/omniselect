/** An option object in which any key may also hold an explicit `undefined`. */
export type OptionsPatch<T> = { [K in keyof T]?: T[K] | undefined };

/**
 * Drop keys whose value is undefined, for creation-time option objects.
 *
 * Update paths keep their keys: `SelectMachine.sync` applies `filter` when the key
 * is present, even if its value is undefined.
 */
export function withoutUndefined<T>(options: OptionsPatch<T>): T {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as T;
}
