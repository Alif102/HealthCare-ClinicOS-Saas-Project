import { describe, expect, it } from "vitest";

import { STATUS_TRANSITIONS as appointmentTransitions } from "@/features/appointments/constants";
import { STATUS_TRANSITIONS as invoiceTransitions } from "@/features/billing/constants";
import { STATUS_TRANSITIONS as rxTransitions } from "@/features/prescriptions/constants";
import { canTransition } from "@/lib/transitions";
import { clampTake } from "@/lib/pagination";
import { buildDailyVolume } from "@/features/reports/daily-volume";
import { reportRangeSchema } from "@/features/reports/schemas";
import { bookAppointmentSchema } from "@/features/appointments/schemas";

describe("canTransition", () => {
  it("enforces appointment staff transitions", () => {
    expect(
      canTransition(appointmentTransitions, "SCHEDULED", "CONFIRMED"),
    ).toBe(true);
    expect(
      canTransition(appointmentTransitions, "SCHEDULED", "COMPLETED"),
    ).toBe(false);
    expect(canTransition(appointmentTransitions, "COMPLETED", "CANCELLED")).toBe(
      false,
    );
  });

  it("enforces invoice and prescription machines", () => {
    expect(canTransition(invoiceTransitions, "DRAFT", "PENDING")).toBe(true);
    expect(canTransition(invoiceTransitions, "PAID", "VOID")).toBe(false);
    expect(canTransition(rxTransitions, "DRAFT", "ACTIVE")).toBe(true);
    expect(canTransition(rxTransitions, "CANCELLED", "ACTIVE")).toBe(false);
  });
});

describe("clampTake", () => {
  it("applies defaults and max", () => {
    expect(clampTake(undefined)).toBe(50);
    expect(clampTake(200)).toBe(100);
    expect(clampTake(0)).toBe(50);
    expect(clampTake(12, { defaultTake: 30, maxTake: 40 })).toBe(12);
  });
});

describe("buildDailyVolume", () => {
  it("fills zero days and counts matches", () => {
    const rows = buildDailyVolume({
      from: "2026-08-01",
      to: "2026-08-03",
      startAts: [
        new Date("2026-08-01T10:00:00.000Z"),
        new Date("2026-08-01T15:00:00.000Z"),
        new Date("2026-08-03T09:00:00.000Z"),
      ],
    });

    expect(rows).toEqual([
      { date: "2026-08-01", count: 2 },
      { date: "2026-08-02", count: 0 },
      { date: "2026-08-03", count: 1 },
    ]);
  });
});

describe("zod fixtures", () => {
  it("accepts valid report ranges", () => {
    expect(
      reportRangeSchema.safeParse({
        from: "2026-08-01",
        to: "2026-08-07",
      }).success,
    ).toBe(true);
  });

  it("rejects inverted report ranges", () => {
    const result = reportRangeSchema.safeParse({
      from: "2026-08-10",
      to: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("requires book appointment fields", () => {
    const result = bookAppointmentSchema.safeParse({
      doctorProfileId: "doc_1",
      patientProfileId: "pat_1",
      startAt: "2026-08-03T09:00:00.000Z",
      type: "IN_PERSON",
    });
    expect(result.success).toBe(true);
  });
});
