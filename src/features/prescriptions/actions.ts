"use server";

import { revalidatePath } from "next/cache";

import { STATUS_TRANSITIONS } from "@/features/prescriptions/constants";
import {
  prescriptionFormSchema,
  updatePrescriptionStatusSchema,
} from "@/features/prescriptions/schemas";
import { NOTIFICATION_EVENT } from "@/features/notifications/constants";
import { notifyUser } from "@/features/notifications/notify";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { canTransition } from "@/lib/transitions";

type ActionResult =
  | { ok: true; prescriptionId?: string }
  | { ok: false; error: string };

type PrescriptionAccess =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof requireTenantContext>>["session"];
      membership: Awaited<ReturnType<typeof requireTenantContext>>["membership"];
      tenantId: string;
      prescription: {
        id: string;
        status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
        doctorProfileId: string;
        patientProfileId: string;
        doctorUserId: string;
        patientUserId: string;
      };
    }
  | { ok: false; error: string };

function mapItems(
  items: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
    quantity?: string;
  }>,
) {
  return items.map((item) => ({
    medicationName: item.medicationName,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration || null,
    instructions: item.instructions || null,
    quantity:
      item.quantity && item.quantity.trim() !== ""
        ? Number(item.quantity)
        : null,
  }));
}

async function assertCanManagePrescription(
  prescriptionId: string,
): Promise<PrescriptionAccess> {
  const { session, membership, tenantId } = await requireTenantContext([
    "DOCTOR",
  ]);

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId },
    select: {
      id: true,
      status: true,
      doctorProfileId: true,
      patientProfileId: true,
      doctorProfile: { select: { userId: true } },
      patientProfile: { select: { userId: true } },
    },
  });

  if (!prescription) {
    return { ok: false, error: "Prescription not found" };
  }

  if (prescription.doctorProfile.userId !== session.user.id) {
    return { ok: false, error: "You can only manage your own prescriptions" };
  }

  return {
    ok: true,
    session,
    membership,
    tenantId,
    prescription: {
      id: prescription.id,
      status: prescription.status,
      doctorProfileId: prescription.doctorProfileId,
      patientProfileId: prescription.patientProfileId,
      doctorUserId: prescription.doctorProfile.userId,
      patientUserId: prescription.patientProfile.userId,
    },
  };
}

async function resolveLinkedAppointment(input: {
  tenantId: string;
  doctorProfileId: string;
  patientProfileId: string;
  appointmentId?: string;
}) {
  if (!input.appointmentId) {
    return { ok: true as const, appointmentId: null };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      tenantId: input.tenantId,
      doctorProfileId: input.doctorProfileId,
      patientProfileId: input.patientProfileId,
    },
    include: {
      prescription: { select: { id: true } },
    },
  });

  if (!appointment) {
    return {
      ok: false as const,
      error: "Appointment not found for this doctor and patient",
    };
  }

  if (appointment.prescription) {
    return {
      ok: false as const,
      error: "That appointment already has a prescription",
    };
  }

  return { ok: true as const, appointmentId: appointment.id };
}

export async function createPrescriptionAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const parsed = prescriptionFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const doctor = await prisma.doctorProfile.findFirst({
    where: { tenantId, userId: session.user.id },
  });

  if (!doctor) {
    return { ok: false, error: "Doctor profile not found" };
  }

  const patient = await prisma.patientProfile.findFirst({
    where: { id: parsed.data.patientProfileId, tenantId },
  });

  if (!patient) {
    return { ok: false, error: "Patient not found" };
  }

  const linked = await resolveLinkedAppointment({
    tenantId,
    doctorProfileId: doctor.id,
    patientProfileId: patient.id,
    appointmentId: parsed.data.appointmentId || undefined,
  });

  if (!linked.ok) {
    return { ok: false, error: linked.error };
  }

  const prescription = await prisma.prescription.create({
    data: {
      tenantId,
      doctorProfileId: doctor.id,
      patientProfileId: patient.id,
      appointmentId: linked.appointmentId,
      status: "DRAFT",
      notes: parsed.data.notes || null,
      items: {
        create: mapItems(parsed.data.items),
      },
    },
  });

  revalidatePath("/prescriptions");
  revalidatePath(`/prescriptions/${prescription.id}`);
  if (linked.appointmentId) {
    revalidatePath(`/appointments/${linked.appointmentId}`);
  }
  return { ok: true, prescriptionId: prescription.id };
}

export async function updatePrescriptionAction(
  prescriptionId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManagePrescription(prescriptionId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  if (access.prescription.status !== "DRAFT") {
    return { ok: false, error: "Only draft prescriptions can be edited" };
  }

  const parsed = prescriptionFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.patientProfileId !== access.prescription.patientProfileId) {
    return { ok: false, error: "Patient cannot be changed on an existing Rx" };
  }

  const existing = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId: access.tenantId },
    select: { appointmentId: true },
  });

  const requestedAppointmentId = parsed.data.appointmentId || null;

  if (requestedAppointmentId !== (existing?.appointmentId ?? null)) {
    if (requestedAppointmentId) {
      const linked = await resolveLinkedAppointment({
        tenantId: access.tenantId,
        doctorProfileId: access.prescription.doctorProfileId,
        patientProfileId: access.prescription.patientProfileId,
        appointmentId: requestedAppointmentId,
      });
      if (!linked.ok) {
        return { ok: false, error: linked.error };
      }
    }

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { appointmentId: requestedAppointmentId },
    });
  }

  await prisma.$transaction([
    prisma.prescriptionItem.deleteMany({ where: { prescriptionId } }),
    prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        notes: parsed.data.notes || null,
        items: {
          create: mapItems(parsed.data.items),
        },
      },
    }),
  ]);

  revalidatePath("/prescriptions");
  revalidatePath(`/prescriptions/${prescriptionId}`);
  return { ok: true, prescriptionId };
}

export async function updatePrescriptionStatusAction(
  prescriptionId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManagePrescription(prescriptionId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = updatePrescriptionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const nextStatus = parsed.data.status;

  if (
    !canTransition(STATUS_TRANSITIONS, access.prescription.status, nextStatus)
  ) {
    return {
      ok: false,
      error: `Cannot move from ${access.prescription.status} to ${nextStatus}`,
    };
  }

  if (nextStatus === "ACTIVE") {
    const itemCount = await prisma.prescriptionItem.count({
      where: { prescriptionId },
    });
    if (itemCount === 0) {
      return { ok: false, error: "Add medications before issuing" };
    }
  }

  await prisma.prescription.update({
    where: { id: prescriptionId },
    data: {
      status: nextStatus,
      ...(nextStatus === "ACTIVE" ? { issuedAt: new Date() } : {}),
    },
  });

  if (nextStatus === "ACTIVE") {
    await notifyUser({
      tenantId: access.tenantId,
      userId: access.prescription.patientUserId,
      event: NOTIFICATION_EVENT.PRESCRIPTION_ISSUED,
      title: "Prescription issued",
      body: "Your clinician issued a new prescription.",
      href: `/prescriptions/${prescriptionId}`,
    });
  }

  revalidatePath("/prescriptions");
  revalidatePath(`/prescriptions/${prescriptionId}`);
  revalidatePath("/notifications");
  return { ok: true, prescriptionId };
}
