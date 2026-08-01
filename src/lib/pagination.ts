/** Clamp list `take` to a safe demo-friendly range. */
export function clampTake(
  take: number | undefined,
  defaults: { defaultTake?: number; maxTake?: number } = {},
) {
  const defaultTake = defaults.defaultTake ?? 50;
  const maxTake = defaults.maxTake ?? 100;
  const value = take ?? defaultTake;
  if (!Number.isFinite(value) || value < 1) {
    return defaultTake;
  }
  return Math.min(Math.floor(value), maxTake);
}
