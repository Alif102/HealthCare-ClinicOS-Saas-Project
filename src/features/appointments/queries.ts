import type { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  generateBookableSlots,
  type BookableSlot,
} from "@/features/appointments/slots";

const appointmentInclude = {
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
  prescription: {
    select: {
      id: true,
      status: true,
    },
  },
} as const;

export type AppointmentListFilters = {
  status?: AppointmentStatus;
  doctorProfileId?: string;
  patientProfileId?: string;
  /** Inclusive YYYY-MM-DD (UTC) */
  from?: string;
  /** Inclusive YYYY-MM-DD (UTC) */
  to?: string;
  take?: number;
};

function dayBounds(isoDate: string) {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  const end = new Date(`${isoDate}T23:59:59.999Z`);
  return { start, end };
}

export async function listAppointments(
  tenantId: string,
  filters: AppointmentListFilters = {},
) {
  const take = Math.min(filters.take ?? 50, 100);
  const startAtFilter: { gte?: Date; lte?: Date } = {};

  if (filters.from) {
    startAtFilter.gte = dayBounds(filters.from).start;
  }
  if (filters.to) {
    startAtFilter.lte = dayBounds(filters.to).end;
  }

  return prisma.appointment.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.doctorProfileId
        ? { doctorProfileId: filters.doctorProfileId }
        : {}),
      ...(filters.patientProfileId
        ? { patientProfileId: filters.patientProfileId }
        : {}),
      ...(Object.keys(startAtFilter).length > 0
        ? { startAt: startAtFilter }
        : {}),
    },
    include: appointmentInclude,
    orderBy: [{ startAt: "asc" }],
    take,
  });
}

export async function getAppointmentById(
  tenantId: string,
  appointmentId: string,
) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: appointmentInclude,
  });
}

export async function listAcceptingDoctors(tenantId: string) {
  return prisma.doctorProfile.findMany({
    where: {
      tenantId,
      isAcceptingPatients: true,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ specialty: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAvailableSlots(input: {
  tenantId: string;
  doctorProfileId: string;
  isoDate: string;
}): Promise<BookableSlot[]> {
  const doctor = await prisma.doctorProfile.findFirst({
    where: {
      id: input.doctorProfileId,
      tenantId: input.tenantId,
      isAcceptingPatients: true,
    },
    include: {
      availabilities: true,
    },
  });

  if (!doctor) {
    return [];
  }

  const { start, end } = dayBounds(input.isoDate);

  const existing = await prisma.appointment.findMany({
    where: {
      tenantId: input.tenantId,
      doctorProfileId: input.doctorProfileId,
      startAt: { gte: start, lte: end },
    },
    select: {
      startAt: true,
      endAt: true,
      status: true,
    },
  });

  return generateBookableSlots({
    isoDate: input.isoDate,
    availabilities: doctor.availabilities,
    existing,
  });
}
