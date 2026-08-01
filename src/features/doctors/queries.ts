import { clampTake } from "@/lib/pagination";
import { prisma } from "@/lib/db";

export async function listDoctors(
  tenantId: string,
  options: { take?: number } = {},
) {
  return prisma.doctorProfile.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          availabilities: true,
        },
      },
    },
    orderBy: [{ specialty: "asc" }, { createdAt: "asc" }],
    take: clampTake(options.take),
  });
}

export async function getDoctorById(tenantId: string, doctorId: string) {
  return prisma.doctorProfile.findFirst({
    where: {
      id: doctorId,
      tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });
}

export async function getDoctorByUserId(tenantId: string, userId: string) {
  return prisma.doctorProfile.findFirst({
    where: {
      tenantId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });
}
