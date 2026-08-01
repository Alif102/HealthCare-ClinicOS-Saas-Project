import { prisma } from "@/lib/db";

export async function listPatients(tenantId: string, search?: string) {
  const query = search?.trim();

  return prisma.patientProfile.findMany({
    where: {
      tenantId,
      ...(query
        ? {
            OR: [
              { phone: { contains: query, mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
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
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getPatientById(tenantId: string, patientId: string) {
  return prisma.patientProfile.findFirst({
    where: {
      id: patientId,
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
      _count: {
        select: {
          appointments: true,
          prescriptions: true,
          allergies: true,
          conditions: true,
        },
      },
    },
  });
}

export async function getPatientByUserId(tenantId: string, userId: string) {
  return prisma.patientProfile.findFirst({
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
      _count: {
        select: {
          appointments: true,
          prescriptions: true,
          allergies: true,
          conditions: true,
        },
      },
    },
  });
}
