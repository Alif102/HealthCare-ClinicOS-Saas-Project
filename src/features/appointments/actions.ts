"use server";

import { revalidatePath } from "next/cache";

import {
  APPOINTMENT_STATUS_LABEL,
  PATIENT_CANCELLABLE,
  STATUS_TRANSITIONS,
} from "@/features/appointments/constants";
import {
  availableSlotsQuerySchema,
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
} from "@/features/appointments/schemas";
import { getAvailableSlots } from "@/features/appointments/queries";
import { slotEndFromAvailability } from "@/features/appointments/slots";
import { NOTIFICATION_EVENT } from "@/features/notifications/constants";
import { notifyUser } from "@/features/notifications/notify";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import type { Role } from "@/types/roles";

function formatAppointmentWhen(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

type ActionResult =
  | { ok: true; appointmentId?: string }
  | { ok: false; error: string };

type SlotResult =
  | { ok: true; slots: Awaited<ReturnType<typeof getAvailableSlots>> }
  | { ok: false; error: string };

type AppointmentAccess =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof requireTenantContext>>["session"];
      membership: Awaited<ReturnType<typeof requireTenantContext>>["membership"];
      tenantId: string;
      appointment: {
        id: string;
        tenantId: string;
        status:
          | "SCHEDULED"
          | "CONFIRMED"
          | "CHECKED_IN"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED"
          | "NO_SHOW";
        doctorProfileId: string;
        patientProfileId: string;
        doctorUserId: string;
        patientUserId: string;
      };
    }
  | { ok: false; error: string };

async function assertCanViewOrManageAppointment(
  appointmentId: string,
  allowed: Role[],
): Promise<AppointmentAccess> {
  const { session, membership, tenantId } = await requireTenantContext(allowed);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      doctorProfileId: true,
      patientProfileId: true,
      doctorProfile: { select: { userId: true } },
      patientProfile: { select: { userId: true } },
    },
  });

  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (
    membership.role === "DOCTOR" &&
    appointment.doctorProfile.userId !== session.user.id
  ) {
    return { ok: false, error: "You can only manage your own appointments" };
  }

  if (
    membership.role === "PATIENT" &&
    appointment.patientProfile.userId !== session.user.id
  ) {
    return { ok: false, error: "You can only manage your own appointments" };
  }

  return {
    ok: true,
    session,
    membership,
    tenantId,
    appointment: {
      id: appointment.id,
      tenantId: appointment.tenantId,
      status: appointment.status,
      doctorProfileId: appointment.doctorProfileId,
      patientProfileId: appointment.patientProfileId,
      doctorUserId: appointment.doctorProfile.userId,
      patientUserId: appointment.patientProfile.userId,
    },
  };
}

export async function getAvailableSlotsAction(
  input: unknown,
): Promise<SlotResult> {
  const { tenantId } = await requireTenantContext();
  const parsed = availableSlotsQuerySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slots = await getAvailableSlots({
    tenantId,
    doctorProfileId: parsed.data.doctorProfileId,
    isoDate: parsed.data.date,
  });

  return { ok: true, slots };
}

export async function bookAppointmentAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const parsed = bookAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);

  if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
    return { ok: false, error: "Choose a future time slot" };
  }

  const doctor = await prisma.doctorProfile.findFirst({
    where: {
      id: data.doctorProfileId,
      tenantId,
      isAcceptingPatients: true,
    },
    include: { availabilities: true },
  });

  if (!doctor) {
    return { ok: false, error: "Doctor not found or not accepting patients" };
  }

  if (
    membership.role === "DOCTOR" &&
    doctor.userId !== session.user.id
  ) {
    return { ok: false, error: "You can only book on your own calendar" };
  }

  const patient = await prisma.patientProfile.findFirst({
    where: { id: data.patientProfileId, tenantId },
  });

  if (!patient) {
    return { ok: false, error: "Patient not found" };
  }

  if (
    membership.role === "PATIENT" &&
    patient.userId !== session.user.id
  ) {
    return { ok: false, error: "You can only book for yourself" };
  }

  const endAt = slotEndFromAvailability({
    startAt,
    availabilities: doctor.availabilities,
  });

  if (!endAt) {
    return { ok: false, error: "Selected time is outside the doctor’s availability" };
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId,
      doctorProfileId: doctor.id,
      status: {
        in: [
          "SCHEDULED",
          "CONFIRMED",
          "CHECKED_IN",
          "IN_PROGRESS",
          "COMPLETED",
        ],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (conflict) {
    return { ok: false, error: "That slot was just taken — pick another time" };
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      doctorProfileId: doctor.id,
      patientProfileId: patient.id,
      startAt,
      endAt,
      status: "SCHEDULED",
      type: data.type,
      reason: data.reason || null,
      notes: membership.role === "PATIENT" ? null : data.notes || null,
    },
  });

  const when = formatAppointmentWhen(startAt);
  const href = `/appointments/${appointment.id}`;

  await notifyUser({
    tenantId,
    userId: doctor.userId,
    event: NOTIFICATION_EVENT.APPOINTMENT_BOOKED,
    title: "New appointment booked",
    body: `A visit is scheduled for ${when} (UTC).`,
    href,
  });

  if (patient.userId !== doctor.userId) {
    await notifyUser({
      tenantId,
      userId: patient.userId,
      event: NOTIFICATION_EVENT.APPOINTMENT_BOOKED,
      title: "Appointment confirmed",
      body: `Your visit is scheduled for ${when} (UTC).`,
      href,
    });
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath("/notifications");
  return { ok: true, appointmentId: appointment.id };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanViewOrManageAppointment(appointmentId, [
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = updateAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const nextStatus = parsed.data.status;
  const current = access.appointment.status;

  if (access.membership.role === "PATIENT") {
    if (
      nextStatus !== "CANCELLED" ||
      !PATIENT_CANCELLABLE.includes(current)
    ) {
      return { ok: false, error: "Patients may only cancel upcoming appointments" };
    }
  } else {
    const allowed = STATUS_TRANSITIONS[current];
    if (!allowed.includes(nextStatus)) {
      return {
        ok: false,
        error: `Cannot move from ${current} to ${nextStatus}`,
      };
    }
  }

  if (nextStatus === "CANCELLED" && !parsed.data.cancellationReason?.trim()) {
    // Reason optional for staff; still accepted when provided.
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: nextStatus,
      cancellationReason:
        nextStatus === "CANCELLED"
          ? parsed.data.cancellationReason || null
          : null,
    },
  });

  const statusLabel = APPOINTMENT_STATUS_LABEL[nextStatus];
  const href = `/appointments/${appointmentId}`;
  const recipients = new Set([
    access.appointment.doctorUserId,
    access.appointment.patientUserId,
  ]);
  recipients.delete(access.session.user.id);

  await Promise.all(
    [...recipients].map((userId) =>
      notifyUser({
        tenantId: access.tenantId,
        userId,
        event: NOTIFICATION_EVENT.APPOINTMENT_STATUS,
        title: `Appointment ${statusLabel.toLowerCase()}`,
        body: `Visit status is now ${statusLabel}.`,
        href,
        meta: { status: nextStatus },
      }),
    ),
  );

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/notifications");
  return { ok: true, appointmentId };
}
