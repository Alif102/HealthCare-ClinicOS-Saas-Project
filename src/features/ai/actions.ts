"use server";

import { assertAiAssistAllowed } from "@/features/admin/queries";
import { AI_MAX_CONTEXT_ITEMS } from "@/features/ai/constants";
import {
  generateEncounterDraft,
  generatePrescriptionDraft,
} from "@/features/ai/provider";
import {
  draftEncounterSchema,
  suggestPrescriptionSchema,
} from "@/features/ai/schemas";
import type { EncounterDraft, PrescriptionDraft } from "@/features/ai/types";
import {
  listPatientAllergies,
  listPatientConditions,
} from "@/features/medical-history/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type DraftEncounterResult =
  | { ok: true; draft: EncounterDraft }
  | { ok: false; error: string };

type SuggestRxResult =
  | { ok: true; draft: PrescriptionDraft }
  | { ok: false; error: string };

async function loadClinicalLabels(
  tenantId: string,
  patientProfileId: string,
) {
  const [allergies, conditions] = await Promise.all([
    listPatientAllergies(tenantId, patientProfileId),
    listPatientConditions(tenantId, patientProfileId),
  ]);

  return {
    allergies: allergies
      .slice(0, AI_MAX_CONTEXT_ITEMS)
      .map((row) => row.allergen),
    conditions: conditions
      .slice(0, AI_MAX_CONTEXT_ITEMS)
      .map((row) => row.name),
  };
}

async function requireAiEnabled(
  tenantId: string,
): Promise<{ ok: false; error: string } | null> {
  const allowed = await assertAiAssistAllowed(tenantId);
  if (!allowed) {
    return {
      ok: false,
      error: "AI assist is disabled for this clinic. Ask an admin to enable it.",
    };
  }
  return null;
}

export async function draftEncounterNotesAction(
  input: unknown,
): Promise<DraftEncounterResult> {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const blocked = await requireAiEnabled(tenantId);
  if (blocked) return blocked;

  const parsed = draftEncounterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: parsed.data.appointmentId, tenantId },
    select: {
      id: true,
      reason: true,
      patientProfileId: true,
      doctorProfile: { select: { userId: true } },
    },
  });

  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (appointment.doctorProfile.userId !== session.user.id) {
    return { ok: false, error: "You can only draft notes for your own visits" };
  }

  const labels = await loadClinicalLabels(
    tenantId,
    appointment.patientProfileId,
  );

  const chiefComplaint =
    parsed.data.chiefComplaint?.trim() ||
    appointment.reason?.trim() ||
    "";

  const draft = await generateEncounterDraft({
    chiefComplaint,
    allergies: labels.allergies,
    conditions: labels.conditions,
  });

  return { ok: true, draft };
}

export async function suggestPrescriptionItemsAction(
  input: unknown,
): Promise<SuggestRxResult> {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const blocked = await requireAiEnabled(tenantId);
  if (blocked) return blocked;

  const parsed = suggestPrescriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const doctor = await prisma.doctorProfile.findFirst({
    where: { tenantId, userId: session.user.id },
    select: { id: true },
  });

  if (!doctor) {
    return { ok: false, error: "Doctor profile required" };
  }

  const patient = await prisma.patientProfile.findFirst({
    where: { id: parsed.data.patientProfileId, tenantId },
    select: { id: true },
  });

  if (!patient) {
    return { ok: false, error: "Patient not found" };
  }

  const labels = await loadClinicalLabels(tenantId, patient.id);

  const draft = await generatePrescriptionDraft({
    chiefComplaint: parsed.data.clinicalHint,
    allergies: labels.allergies,
    conditions: labels.conditions,
  });

  return { ok: true, draft };
}
