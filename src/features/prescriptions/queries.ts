import type { PrescriptionStatus } from "@prisma/client";

import { clampTake } from "@/lib/pagination";
import { prisma } from "@/lib/db";

const prescriptionInclude = {
  doctorProfile: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  patientProfile: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  appointment: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
    },
  },
  items: {
    orderBy: { medicationName: "asc" as const },
  },
} as const;

export type PrescriptionListFilters = {
  status?: PrescriptionStatus;
  doctorProfileId?: string;
  patientProfileId?: string;
  take?: number;
};

export async function listPrescriptions(
  tenantId: string,
  filters: PrescriptionListFilters = {},
) {
  const take = clampTake(filters.take);

  return prisma.prescription.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.doctorProfileId
        ? { doctorProfileId: filters.doctorProfileId }
        : {}),
      ...(filters.patientProfileId
        ? { patientProfileId: filters.patientProfileId }
        : {}),
    },
    include: {
      doctorProfile: prescriptionInclude.doctorProfile,
      patientProfile: prescriptionInclude.patientProfile,
      appointment: prescriptionInclude.appointment,
      _count: { select: { items: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
  });
}

export async function getPrescriptionById(
  tenantId: string,
  prescriptionId: string,
) {
  return prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId },
    include: prescriptionInclude,
  });
}

export async function listDoctorAppointmentsForRx(input: {
  tenantId: string;
  doctorProfileId: string;
  patientProfileId?: string;
}) {
  return prisma.appointment.findMany({
    where: {
      tenantId: input.tenantId,
      doctorProfileId: input.doctorProfileId,
      ...(input.patientProfileId
        ? { patientProfileId: input.patientProfileId }
        : {}),
      status: {
        in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"],
      },
      prescription: null,
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      patientProfileId: true,
      patientProfile: {
        select: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: [{ startAt: "desc" }],
    take: 40,
  });
}
