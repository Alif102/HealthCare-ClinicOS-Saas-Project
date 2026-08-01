/** Max inclusive day span for report queries (keeps DB load bounded). */
export const MAX_REPORT_RANGE_DAYS = 90;

export const REPORT_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

export function defaultReportFrom(days = 30) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

export function defaultReportTo() {
  return new Date().toISOString().slice(0, 10);
}

export function clampReportRange(from: string, to: string) {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T23:59:59.999Z`);

  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || from > to) {
    return { from: defaultReportFrom(), to: defaultReportTo() };
  }

  const daySpan =
    Math.floor((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1;

  if (daySpan <= MAX_REPORT_RANGE_DAYS) {
    return { from, to };
  }

  const clampedFrom = new Date(toMs);
  clampedFrom.setUTCDate(
    clampedFrom.getUTCDate() - (MAX_REPORT_RANGE_DAYS - 1),
  );
  return {
    from: clampedFrom.toISOString().slice(0, 10),
    to,
  };
}
