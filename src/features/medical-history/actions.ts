"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import {
  allergySchema,
  conditionSchema,
  encounterSchema,
} from "@/features/medical-history/schemas";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function parseOptionalDate(value?: string) {
  if (!value || value.trim() === "") return null;
  return new Date(value);
}

function buildVitalsJson(input: {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
}): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const vitals: Record<string, string> = {};
  if (input.bloodPressure?.trim()) vitals.bloodPressure = input.bloodPressure.trim();
  if (input.heartRate?.trim()) vitals.heartRate = input.heartRate.trim();
  if (input.temperature?.trim()) vitals.temperature = input.temperature.trim();
  if (input.weight?.trim()) vitals.weight = input.weight.trim();
  return Object.keys(vitals).length > 0 ? vitals : Prisma.JsonNull;
}

async function assertCanManagePatientChart(patientProfileId: string) {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const patient = await prisma.patientProfile.findFirst({
    where: { id: patientProfileId, tenantId },
    select: { id: true, userId: true },
  });

  if (!patient) {
    return { ok: false as const, error: "Patient not found" };
  }

  if (membership.role === "PATIENT" && patient.userId !== session.user.id) {
    return { ok: false as const, error: "You can only manage your own chart" };
  }

  return { ok: true as const, session, membership, tenantId, patient };
}

function revalidatePatientHistory(patientProfileId: string) {
  revalidatePath(`/patients/${patientProfileId}`);
  revalidatePath(`/patients/${patientProfileId}/history`);
  revalidatePath("/patients");
}

export async function createAllergyAction(
  patientProfileId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManagePatientChart(patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsed = allergySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const row = await prisma.allergy.create({
    data: {
      tenantId: access.tenantId,
      patientProfileId,
      allergen: parsed.data.allergen,
      reaction: parsed.data.reaction || null,
      severity: parsed.data.severity,
      notedAt: parseOptionalDate(parsed.data.notedAt) ?? new Date(),
    },
  });

  revalidatePatientHistory(patientProfileId);
  return { ok: true, id: row.id };
}

export async function updateAllergyAction(
  allergyId: string,
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const existing = await prisma.allergy.findFirst({
    where: { id: allergyId, tenantId },
  });
  if (!existing) return { ok: false, error: "Allergy not found" };

  const access = await assertCanManagePatientChart(existing.patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsed = allergySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.allergy.update({
    where: { id: allergyId },
    data: {
      allergen: parsed.data.allergen,
      reaction: parsed.data.reaction || null,
      severity: parsed.data.severity,
      notedAt: parseOptionalDate(parsed.data.notedAt) ?? existing.notedAt,
    },
  });

  revalidatePatientHistory(existing.patientProfileId);
  return { ok: true, id: allergyId };
}

export async function deleteAllergyAction(
  allergyId: string,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const existing = await prisma.allergy.findFirst({
    where: { id: allergyId, tenantId },
  });
  if (!existing) return { ok: false, error: "Allergy not found" };

  const access = await assertCanManagePatientChart(existing.patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  await prisma.allergy.delete({ where: { id: allergyId } });
  revalidatePatientHistory(existing.patientProfileId);
  return { ok: true, id: allergyId };
}

export async function createConditionAction(
  patientProfileId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManagePatientChart(patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsed = conditionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const row = await prisma.medicalCondition.create({
    data: {
      tenantId: access.tenantId,
      patientProfileId,
      name: parsed.data.name,
      status: parsed.data.status,
      diagnosedAt: parseOptionalDate(parsed.data.diagnosedAt),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePatientHistory(patientProfileId);
  return { ok: true, id: row.id };
}

export async function updateConditionAction(
  conditionId: string,
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const existing = await prisma.medicalCondition.findFirst({
    where: { id: conditionId, tenantId },
  });
  if (!existing) return { ok: false, error: "Condition not found" };

  const access = await assertCanManagePatientChart(existing.patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsed = conditionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.medicalCondition.update({
    where: { id: conditionId },
    data: {
      name: parsed.data.name,
      status: parsed.data.status,
      diagnosedAt: parseOptionalDate(parsed.data.diagnosedAt),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePatientHistory(existing.patientProfileId);
  return { ok: true, id: conditionId };
}

export async function deleteConditionAction(
  conditionId: string,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const existing = await prisma.medicalCondition.findFirst({
    where: { id: conditionId, tenantId },
  });
  if (!existing) return { ok: false, error: "Condition not found" };

  const access = await assertCanManagePatientChart(existing.patientProfileId);
  if (!access.ok) return { ok: false, error: access.error };

  await prisma.medicalCondition.delete({ where: { id: conditionId } });
  revalidatePatientHistory(existing.patientProfileId);
  return { ok: true, id: conditionId };
}

export async function upsertEncounterAction(
  appointmentId: string,
  input: unknown,
): Promise<ActionResult> {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);

  const parsed = encounterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      doctorProfile: { select: { id: true, userId: true } },
      encounter: { select: { id: true } },
    },
  });

  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (appointment.doctorProfile.userId !== session.user.id) {
    return { ok: false, error: "You can only chart visits on your own calendar" };
  }

  const vitalsJson = buildVitalsJson(parsed.data);
  const payload = {
    chiefComplaint: parsed.data.chiefComplaint || null,
    assessment: parsed.data.assessment || null,
    plan: parsed.data.plan || null,
    vitalsJson,
  };

  const encounter = appointment.encounter
    ? await prisma.encounter.update({
        where: { id: appointment.encounter.id },
        data: payload,
      })
    : await prisma.encounter.create({
        data: {
          tenantId,
          appointmentId: appointment.id,
          doctorProfileId: appointment.doctorProfileId,
          patientProfileId: appointment.patientProfileId,
          ...payload,
        },
      });

  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath(`/appointments/${appointmentId}/encounter`);
  revalidatePath(`/encounters/${encounter.id}`);
  revalidatePath(`/patients/${appointment.patientProfileId}/history`);
  return { ok: true, id: encounter.id };
}
