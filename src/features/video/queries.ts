import { clampTake } from "@/lib/pagination";
import { prisma } from "@/lib/db";
import { resolveVideoSessionStatus } from "@/features/video/constants";

const sessionInclude = {
  appointment: {
    include: {
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
    },
  },
} as const;

export async function getConsultationById(tenantId: string, sessionId: string) {
  const session = await prisma.consultationSession.findFirst({
    where: { id: sessionId, tenantId },
    include: sessionInclude,
  });

  if (!session) return null;

  return {
    ...session,
    status: resolveVideoSessionStatus(session),
  };
}

export async function getConsultationByAppointmentId(
  tenantId: string,
  appointmentId: string,
) {
  const session = await prisma.consultationSession.findFirst({
    where: { tenantId, appointmentId },
    include: sessionInclude,
  });

  if (!session) return null;

  return {
    ...session,
    status: resolveVideoSessionStatus(session),
  };
}

export async function listVideoAppointments(
  tenantId: string,
  filters: {
    doctorProfileId?: string;
    patientProfileId?: string;
    take?: number;
  } = {},
) {
  const take = clampTake(filters.take, { defaultTake: 30, maxTake: 50 });

  return prisma.appointment.findMany({
    where: {
      tenantId,
      type: "VIDEO",
      ...(filters.doctorProfileId
        ? { doctorProfileId: filters.doctorProfileId }
        : {}),
      ...(filters.patientProfileId
        ? { patientProfileId: filters.patientProfileId }
        : {}),
      status: {
        in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"],
      },
    },
    include: {
      doctorProfile: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      patientProfile: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      consultation: {
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          roomName: true,
        },
      },
    },
    orderBy: [{ startAt: "desc" }],
    take,
  });
}
