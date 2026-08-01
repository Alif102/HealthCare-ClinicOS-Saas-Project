export type DailyVolumeRow = {
  date: string;
  count: number;
};

/**
 * Builds a dense day-by-day series (zeros included) from appointment timestamps.
 * Dates are UTC calendar days (`YYYY-MM-DD`).
 */
export function buildDailyVolume(input: {
  from: string;
  to: string;
  startAts: Date[];
}): DailyVolumeRow[] {
  const counts = new Map<string, number>();
  const cursor = new Date(`${input.from}T00:00:00.000Z`);
  const end = new Date(`${input.to}T00:00:00.000Z`);

  while (cursor <= end) {
    counts.set(cursor.toISOString().slice(0, 10), 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const startAt of input.startAts) {
    const key = startAt.toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}
