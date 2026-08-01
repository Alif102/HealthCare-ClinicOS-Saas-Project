import { prisma } from "@/lib/db";

export async function listPatientAllergies(
  tenantId: string,
  patientProfileId: string,
) {
  return prisma.allergy.findMany({
    where: { tenantId, patientProfileId },
    orderBy: [{ notedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function listPatientConditions(
  tenantId: string,
  patientProfileId: string,
) {
  return prisma.medicalCondition.findMany({
    where: { tenantId, patientProfileId },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function listPatientEncounters(
  tenantId: string,
  patientProfileId: string,
) {
  return prisma.encounter.findMany({
    where: { tenantId, patientProfileId },
    include: {
      doctorProfile: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      appointment: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          type: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });
}

export async function getEncounterById(tenantId: string, encounterId: string) {
  return prisma.encounter.findFirst({
    where: { id: encounterId, tenantId },
    include: {
      doctorProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      patientProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      appointment: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          type: true,
          reason: true,
        },
      },
    },
  });
}

export async function getEncounterByAppointmentId(
  tenantId: string,
  appointmentId: string,
) {
  return prisma.encounter.findFirst({
    where: { tenantId, appointmentId },
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
    },
  });
}

export async function getPatientHistoryBundle(
  tenantId: string,
  patientProfileId: string,
) {
  const [allergies, conditions, encounters, patient] = await Promise.all([
    listPatientAllergies(tenantId, patientProfileId),
    listPatientConditions(tenantId, patientProfileId),
    listPatientEncounters(tenantId, patientProfileId),
    prisma.patientProfile.findFirst({
      where: { id: patientProfileId, tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return { patient, allergies, conditions, encounters };
}
