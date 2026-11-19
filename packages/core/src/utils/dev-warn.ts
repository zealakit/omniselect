/** Dev-only warning. Silent when `NODE_ENV` is `production`. SSR-safe. */
export function devWarn(message: string): void {
  const env = (
    globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }
  ).process?.env?.NODE_ENV;
  if (env === "production") {
    return;
  }
  console.warn(
    `[omniselect] ${message} (docs: https://github.com/zealakit/omniselect/blob/main/README.md)`,
  );
}
