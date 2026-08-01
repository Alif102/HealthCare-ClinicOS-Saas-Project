"use server";

import { revalidatePath } from "next/cache";

import { VIDEO_ELIGIBLE_APPOINTMENT_STATUSES } from "@/features/video/constants";
import {
  buildJitsiJoinUrl,
  createRoomName,
} from "@/features/video/provider";
import {
  appointmentIdSchema,
  sessionIdSchema,
} from "@/features/video/schemas";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type ActionResult =
  | { ok: true; sessionId?: string }
  | { ok: false; error: string };

function revalidateVideoPaths(appointmentId: string, sessionId?: string) {
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/video");
  if (sessionId) {
    revalidatePath(`/video/${sessionId}`);
  }
}

async function loadAppointmentForVideo(tenantId: string, appointmentId: string) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    select: {
      id: true,
      type: true,
      status: true,
      doctorProfileId: true,
      patientProfileId: true,
      doctorProfile: { select: { userId: true } },
      patientProfile: { select: { userId: true } },
      consultation: { select: { id: true, endedAt: true } },
    },
  });
}

function canPrepareSession(
  role: string,
  userId: string,
  appointment: {
    doctorProfile: { userId: string };
    patientProfile: { userId: string };
  },
) {
  if (role === "ADMIN" || role === "RECEPTIONIST") return true;
  if (role === "DOCTOR" && appointment.doctorProfile.userId === userId) {
    return true;
  }
  return false;
}

function canJoinOrEnd(
  role: string,
  userId: string,
  appointment: {
    doctorProfile: { userId: string };
    patientProfile: { userId: string };
  },
) {
  if (role === "ADMIN" || role === "RECEPTIONIST") return true;
  if (role === "DOCTOR" && appointment.doctorProfile.userId === userId) {
    return true;
  }
  if (role === "PATIENT" && appointment.patientProfile.userId === userId) {
    return true;
  }
  return false;
}

export async function createConsultationSessionAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
  ]);
  const parsed = appointmentIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid appointment" };
  }

  const appointment = await loadAppointmentForVideo(
    tenantId,
    parsed.data.appointmentId,
  );

  if (!appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (
    !canPrepareSession(membership.role, session.user.id, appointment)
  ) {
    return { ok: false, error: "Not allowed to prepare this video room" };
  }

  if (appointment.type !== "VIDEO") {
    return {
      ok: false,
      error: "Only video appointments can have a consultation room",
    };
  }

  if (
    !VIDEO_ELIGIBLE_APPOINTMENT_STATUSES.includes(
      appointment.status as (typeof VIDEO_ELIGIBLE_APPOINTMENT_STATUSES)[number],
    )
  ) {
    return { ok: false, error: "This appointment cannot open a video room" };
  }

  if (appointment.consultation) {
    if (appointment.consultation.endedAt) {
      return { ok: false, error: "This video session has already ended" };
    }
    return { ok: true, sessionId: appointment.consultation.id };
  }

  const roomName = createRoomName();
  const created = await prisma.consultationSession.create({
    data: {
      tenantId,
      appointmentId: appointment.id,
      roomName,
      joinUrl: buildJitsiJoinUrl(roomName),
    },
  });

  revalidateVideoPaths(appointment.id, created.id);
  return { ok: true, sessionId: created.id };
}

export async function startConsultationSessionAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);
  const parsed = sessionIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid session" };
  }

  const consultation = await prisma.consultationSession.findFirst({
    where: { id: parsed.data.sessionId, tenantId },
    include: {
      appointment: {
        select: {
          id: true,
          status: true,
          doctorProfile: { select: { userId: true } },
          patientProfile: { select: { userId: true } },
        },
      },
    },
  });

  if (!consultation) {
    return { ok: false, error: "Session not found" };
  }

  if (
    !canJoinOrEnd(membership.role, session.user.id, consultation.appointment)
  ) {
    return { ok: false, error: "Not allowed to join this session" };
  }

  if (consultation.endedAt) {
    return { ok: false, error: "This session has ended" };
  }

  if (!consultation.startedAt) {
    await prisma.consultationSession.update({
      where: { id: consultation.id },
      data: { startedAt: new Date() },
    });

    if (
      consultation.appointment.status === "SCHEDULED" ||
      consultation.appointment.status === "CONFIRMED" ||
      consultation.appointment.status === "CHECKED_IN"
    ) {
      await prisma.appointment.update({
        where: { id: consultation.appointment.id },
        data: { status: "IN_PROGRESS" },
      });
    }
  }

  revalidateVideoPaths(consultation.appointment.id, consultation.id);
  return { ok: true, sessionId: consultation.id };
}

export async function endConsultationSessionAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
  ]);
  const parsed = sessionIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid session" };
  }

  const consultation = await prisma.consultationSession.findFirst({
    where: { id: parsed.data.sessionId, tenantId },
    include: {
      appointment: {
        select: {
          id: true,
          status: true,
          doctorProfile: { select: { userId: true } },
          patientProfile: { select: { userId: true } },
        },
      },
    },
  });

  if (!consultation) {
    return { ok: false, error: "Session not found" };
  }

  if (
    !canPrepareSession(membership.role, session.user.id, consultation.appointment)
  ) {
    return { ok: false, error: "Not allowed to end this session" };
  }

  if (consultation.endedAt) {
    return { ok: true, sessionId: consultation.id };
  }

  await prisma.consultationSession.update({
    where: { id: consultation.id },
    data: {
      endedAt: new Date(),
      startedAt: consultation.startedAt ?? new Date(),
    },
  });

  if (consultation.appointment.status === "IN_PROGRESS") {
    await prisma.appointment.update({
      where: { id: consultation.appointment.id },
      data: { status: "COMPLETED" },
    });
  }

  revalidateVideoPaths(consultation.appointment.id, consultation.id);
  return { ok: true, sessionId: consultation.id };
}
