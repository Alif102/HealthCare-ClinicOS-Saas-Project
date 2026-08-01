import type { AppointmentStatus, DayOfWeek, DoctorAvailability } from "@prisma/client";

import { BLOCKING_STATUSES } from "@/features/appointments/constants";

export type BookableSlot = {
  startAt: string;
  endAt: string;
  label: string;
};

type Interval = {
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
};

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

function parseHhMm(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHhMm(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function utcDateParts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function utcAt(isoDate: string, totalMinutes: number) {
  const { year, month, day } = utcDateParts(isoDate);
  return new Date(
    Date.UTC(year, month - 1, day, Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0),
  );
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function dayOfWeekForUtcDate(isoDate: string): DayOfWeek {
  const { year, month, day } = utcDateParts(isoDate);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return JS_DAY_TO_ENUM[jsDay]!;
}

/**
 * Builds open slots for one calendar day from weekly templates.
 * Times are treated as UTC wall-clock (demo tenant timezone = UTC).
 */
export function generateBookableSlots(input: {
  isoDate: string;
  availabilities: Pick<
    DoctorAvailability,
    "dayOfWeek" | "startTime" | "endTime" | "slotMinutes" | "isActive"
  >[];
  existing: Interval[];
  now?: Date;
}): BookableSlot[] {
  const now = input.now ?? new Date();
  const dayOfWeek = dayOfWeekForUtcDate(input.isoDate);
  const templates = input.availabilities.filter(
    (row) => row.isActive && row.dayOfWeek === dayOfWeek,
  );

  const occupied = input.existing.filter((row) =>
    BLOCKING_STATUSES.includes(row.status),
  );

  const slots: BookableSlot[] = [];

  for (const template of templates) {
    const startMin = parseHhMm(template.startTime);
    const endMin = parseHhMm(template.endTime);
    const step = template.slotMinutes;

    for (let cursor = startMin; cursor + step <= endMin; cursor += step) {
      const startAt = utcAt(input.isoDate, cursor);
      const endAt = utcAt(input.isoDate, cursor + step);

      if (endAt <= now) {
        continue;
      }

      const taken = occupied.some((row) =>
        intervalsOverlap(startAt, endAt, row.startAt, row.endAt),
      );

      if (taken) {
        continue;
      }

      slots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        label: `${formatHhMm(cursor)} – ${formatHhMm(cursor + step)}`,
      });
    }
  }

  return slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function slotEndFromAvailability(input: {
  startAt: Date;
  availabilities: Pick<
    DoctorAvailability,
    "dayOfWeek" | "startTime" | "endTime" | "slotMinutes" | "isActive"
  >[];
}): Date | null {
  const isoDate = input.startAt.toISOString().slice(0, 10);
  const dayOfWeek = dayOfWeekForUtcDate(isoDate);
  const startMin =
    input.startAt.getUTCHours() * 60 + input.startAt.getUTCMinutes();

  const template = input.availabilities.find((row) => {
    if (!row.isActive || row.dayOfWeek !== dayOfWeek) return false;
    const windowStart = parseHhMm(row.startTime);
    const windowEnd = parseHhMm(row.endTime);
    if (startMin < windowStart || startMin + row.slotMinutes > windowEnd) {
      return false;
    }
    return (startMin - windowStart) % row.slotMinutes === 0;
  });

  if (!template) {
    return null;
  }

  return new Date(input.startAt.getTime() + template.slotMinutes * 60_000);
}
