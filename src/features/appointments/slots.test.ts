import { describe, expect, it } from "vitest";

import {
  dayOfWeekForUtcDate,
  generateBookableSlots,
  slotEndFromAvailability,
} from "@/features/appointments/slots";

const mondayTemplate = {
  dayOfWeek: "MONDAY" as const,
  startTime: "09:00",
  endTime: "11:00",
  slotMinutes: 30,
  isActive: true,
};

describe("dayOfWeekForUtcDate", () => {
  it("maps a known Monday", () => {
    // 2026-08-03 is a Monday in UTC
    expect(dayOfWeekForUtcDate("2026-08-03")).toBe("MONDAY");
  });

  it("maps a known Sunday", () => {
    expect(dayOfWeekForUtcDate("2026-08-02")).toBe("SUNDAY");
  });
});

describe("generateBookableSlots", () => {
  it("emits half-hour slots inside the template window", () => {
    const slots = generateBookableSlots({
      isoDate: "2026-08-03",
      availabilities: [mondayTemplate],
      existing: [],
      now: new Date("2026-08-01T00:00:00.000Z"),
    });

    expect(slots.map((s) => s.label)).toEqual([
      "09:00 – 09:30",
      "09:30 – 10:00",
      "10:00 – 10:30",
      "10:30 – 11:00",
    ]);
  });

  it("skips inactive templates and wrong weekdays", () => {
    const slots = generateBookableSlots({
      isoDate: "2026-08-03",
      availabilities: [
        { ...mondayTemplate, isActive: false },
        { ...mondayTemplate, dayOfWeek: "TUESDAY" },
      ],
      existing: [],
      now: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(slots).toEqual([]);
  });

  it("excludes slots that overlap blocking appointments", () => {
    const slots = generateBookableSlots({
      isoDate: "2026-08-03",
      availabilities: [mondayTemplate],
      existing: [
        {
          startAt: new Date("2026-08-03T09:00:00.000Z"),
          endAt: new Date("2026-08-03T09:30:00.000Z"),
          status: "CONFIRMED",
        },
      ],
      now: new Date("2026-08-01T00:00:00.000Z"),
    });

    expect(slots.map((s) => s.label)).toEqual([
      "09:30 – 10:00",
      "10:00 – 10:30",
      "10:30 – 11:00",
    ]);
  });

  it("skips past slots relative to now", () => {
    const slots = generateBookableSlots({
      isoDate: "2026-08-03",
      availabilities: [mondayTemplate],
      existing: [],
      // Slot ends at :30 — still open while now is inside the window
      now: new Date("2026-08-03T10:31:00.000Z"),
    });

    expect(slots.map((s) => s.label)).toEqual(["10:30 – 11:00"]);
  });

  it("ignores cancelled appointments for occupancy", () => {
    const slots = generateBookableSlots({
      isoDate: "2026-08-03",
      availabilities: [mondayTemplate],
      existing: [
        {
          startAt: new Date("2026-08-03T09:00:00.000Z"),
          endAt: new Date("2026-08-03T09:30:00.000Z"),
          status: "CANCELLED",
        },
      ],
      now: new Date("2026-08-01T00:00:00.000Z"),
    });

    expect(slots[0]?.label).toBe("09:00 – 09:30");
  });
});

describe("slotEndFromAvailability", () => {
  it("returns end when start aligns to a template", () => {
    const end = slotEndFromAvailability({
      startAt: new Date("2026-08-03T09:30:00.000Z"),
      availabilities: [mondayTemplate],
    });
    expect(end?.toISOString()).toBe("2026-08-03T10:00:00.000Z");
  });

  it("returns null when start is outside templates", () => {
    const end = slotEndFromAvailability({
      startAt: new Date("2026-08-03T08:00:00.000Z"),
      availabilities: [mondayTemplate],
    });
    expect(end).toBeNull();
  });
});
