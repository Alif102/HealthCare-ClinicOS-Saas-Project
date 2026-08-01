import type {
  AppointmentStatus,
  AppointmentType,
  PrescriptionStatus,
} from "@prisma/client";

import {
  buildDailyVolume,
  type DailyVolumeRow,
} from "@/features/reports/daily-volume";
import { prisma } from "@/lib/db";

export type { DailyVolumeRow };

export type ReportScope = {
  tenantId: string;
  /** Inclusive YYYY-MM-DD (UTC) */
  from: string;
  /** Inclusive YYYY-MM-DD (UTC) */
  to: string;
  /** When set, all appointment/Rx/encounter metrics are doctor-scoped */
  doctorProfileId?: string;
};

function dayBounds(isoDate: string) {
  return {
    start: new Date(`${isoDate}T00:00:00.000Z`),
    end: new Date(`${isoDate}T23:59:59.999Z`),
  };
}

function rangeFilter(from: string, to: string) {
  return {
    gte: dayBounds(from).start,
    lte: dayBounds(to).end,
  };
}

export type CountRow<T extends string> = {
  key: T;
  count: number;
};

function fillCounts<T extends string>(
  keys: readonly T[],
  rows: { key: T; count: number }[],
): CountRow<T>[] {
  const map = new Map(rows.map((row) => [row.key, row.count]));
  return keys.map((key) => ({ key, count: map.get(key) ?? 0 }));
}

export async function getAppointmentStatusBreakdown(scope: ReportScope) {
  const rows = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      tenantId: scope.tenantId,
      startAt: rangeFilter(scope.from, scope.to),
      ...(scope.doctorProfileId
        ? { doctorProfileId: scope.doctorProfileId }
        : {}),
    },
    _count: { _all: true },
  });

  const statuses = [
    "SCHEDULED",
    "CONFIRMED",
    "CHECKED_IN",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ] as const satisfies readonly AppointmentStatus[];

  return fillCounts(
    statuses,
    rows.map((row) => ({ key: row.status, count: row._count._all })),
  );
}

export async function getAppointmentTypeBreakdown(scope: ReportScope) {
  const rows = await prisma.appointment.groupBy({
    by: ["type"],
    where: {
      tenantId: scope.tenantId,
      startAt: rangeFilter(scope.from, scope.to),
      ...(scope.doctorProfileId
        ? { doctorProfileId: scope.doctorProfileId }
        : {}),
    },
    _count: { _all: true },
  });

  const types = [
    "IN_PERSON",
    "VIDEO",
    "FOLLOW_UP",
  ] as const satisfies readonly AppointmentType[];

  return fillCounts(
    types,
    rows.map((row) => ({ key: row.type, count: row._count._all })),
  );
}

export async function getPrescriptionStatusBreakdown(scope: ReportScope) {
  const rows = await prisma.prescription.groupBy({
    by: ["status"],
    where: {
      tenantId: scope.tenantId,
      createdAt: rangeFilter(scope.from, scope.to),
      ...(scope.doctorProfileId
        ? { doctorProfileId: scope.doctorProfileId }
        : {}),
    },
    _count: { _all: true },
  });

  const statuses = [
    "DRAFT",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ] as const satisfies readonly PrescriptionStatus[];

  return fillCounts(
    statuses,
    rows.map((row) => ({ key: row.status, count: row._count._all })),
  );
}

export async function getReportSummary(scope: ReportScope) {
  const startAt = rangeFilter(scope.from, scope.to);
  const doctorFilter = scope.doctorProfileId
    ? { doctorProfileId: scope.doctorProfileId }
    : {};

  const [
    appointmentsTotal,
    appointmentsCompleted,
    appointmentsCancelled,
    appointmentsNoShow,
    prescriptionsTotal,
    encountersTotal,
    patientsTotal,
    doctorsTotal,
    newPatientsInRange,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        tenantId: scope.tenantId,
        startAt,
        ...doctorFilter,
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId: scope.tenantId,
        startAt,
        status: "COMPLETED",
        ...doctorFilter,
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId: scope.tenantId,
        startAt,
        status: "CANCELLED",
        ...doctorFilter,
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId: scope.tenantId,
        startAt,
        status: "NO_SHOW",
        ...doctorFilter,
      },
    }),
    prisma.prescription.count({
      where: {
        tenantId: scope.tenantId,
        createdAt: startAt,
        ...doctorFilter,
      },
    }),
    prisma.encounter.count({
      where: {
        tenantId: scope.tenantId,
        createdAt: startAt,
        ...doctorFilter,
      },
    }),
    scope.doctorProfileId
      ? prisma.appointment
          .findMany({
            where: {
              tenantId: scope.tenantId,
              startAt,
              doctorProfileId: scope.doctorProfileId,
            },
            select: { patientProfileId: true },
            distinct: ["patientProfileId"],
          })
          .then((rows) => rows.length)
      : prisma.patientProfile.count({
          where: { tenantId: scope.tenantId },
        }),
    scope.doctorProfileId
      ? Promise.resolve(1)
      : prisma.doctorProfile.count({
          where: { tenantId: scope.tenantId },
        }),
    scope.doctorProfileId
      ? Promise.resolve(0)
      : prisma.patientProfile.count({
          where: {
            tenantId: scope.tenantId,
            createdAt: startAt,
          },
        }),
  ]);

  const attendedOrClosed =
    appointmentsCompleted + appointmentsCancelled + appointmentsNoShow;
  const noShowRate =
    attendedOrClosed === 0
      ? 0
      : Math.round((appointmentsNoShow / attendedOrClosed) * 1000) / 10;
  const completionRate =
    appointmentsTotal === 0
      ? 0
      : Math.round((appointmentsCompleted / appointmentsTotal) * 1000) / 10;

  return {
    appointmentsTotal,
    appointmentsCompleted,
    appointmentsCancelled,
    appointmentsNoShow,
    prescriptionsTotal,
    encountersTotal,
    patientsTotal,
    doctorsTotal,
    newPatientsInRange,
    noShowRate,
    completionRate,
  };
}

export type DoctorWorkloadRow = {
  doctorProfileId: string;
  name: string;
  specialty: string;
  appointments: number;
  completed: number;
  prescriptions: number;
  encounters: number;
};

export async function getDoctorWorkload(
  tenantId: string,
  from: string,
  to: string,
): Promise<DoctorWorkloadRow[]> {
  const startAt = rangeFilter(from, to);
  const doctors = await prisma.doctorProfile.findMany({
    where: { tenantId },
    select: {
      id: true,
      specialty: true,
      user: { select: { name: true } },
    },
    orderBy: [{ specialty: "asc" }, { createdAt: "asc" }],
  });

  if (doctors.length === 0) return [];

  const [appointmentRows, completedRows, prescriptionRows, encounterRows] =
    await Promise.all([
      prisma.appointment.groupBy({
        by: ["doctorProfileId"],
        where: { tenantId, startAt },
        _count: { _all: true },
      }),
      prisma.appointment.groupBy({
        by: ["doctorProfileId"],
        where: { tenantId, startAt, status: "COMPLETED" },
        _count: { _all: true },
      }),
      prisma.prescription.groupBy({
        by: ["doctorProfileId"],
        where: { tenantId, createdAt: startAt },
        _count: { _all: true },
      }),
      prisma.encounter.groupBy({
        by: ["doctorProfileId"],
        where: { tenantId, createdAt: startAt },
        _count: { _all: true },
      }),
    ]);

  const appointmentsMap = new Map(
    appointmentRows.map((row) => [row.doctorProfileId, row._count._all]),
  );
  const completedMap = new Map(
    completedRows.map((row) => [row.doctorProfileId, row._count._all]),
  );
  const prescriptionsMap = new Map(
    prescriptionRows.map((row) => [row.doctorProfileId, row._count._all]),
  );
  const encountersMap = new Map(
    encounterRows.map((row) => [row.doctorProfileId, row._count._all]),
  );

  return doctors
    .map((doctor) => ({
      doctorProfileId: doctor.id,
      name: doctor.user.name,
      specialty: doctor.specialty,
      appointments: appointmentsMap.get(doctor.id) ?? 0,
      completed: completedMap.get(doctor.id) ?? 0,
      prescriptions: prescriptionsMap.get(doctor.id) ?? 0,
      encounters: encountersMap.get(doctor.id) ?? 0,
    }))
    .sort((a, b) => b.appointments - a.appointments);
}

export async function getDailyAppointmentVolume(
  scope: ReportScope,
): Promise<DailyVolumeRow[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: scope.tenantId,
      startAt: rangeFilter(scope.from, scope.to),
      ...(scope.doctorProfileId
        ? { doctorProfileId: scope.doctorProfileId }
        : {}),
    },
    select: { startAt: true },
    orderBy: { startAt: "asc" },
  });

  return buildDailyVolume({
    from: scope.from,
    to: scope.to,
    startAts: appointments.map((row) => row.startAt),
  });
}
