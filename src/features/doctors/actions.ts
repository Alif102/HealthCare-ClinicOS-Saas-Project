"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth-session";
import {
  availabilitySchema,
  createDoctorSchema,
  doctorProfileSchema,
} from "@/features/doctors/schemas";

type ActionResult =
  | { ok: true; doctorId?: string }
  | { ok: false; error: string };

type DoctorAccess =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof requireTenantContext>>["session"];
      membership: Awaited<ReturnType<typeof requireTenantContext>>["membership"];
      tenantId: string;
      doctor: {
        id: string;
        userId: string;
        tenantId: string;
      };
    }
  | { ok: false; error: string };

function parseFee(value?: string) {
  if (!value || value.trim() === "") return null;
  return new Prisma.Decimal(value);
}

async function assertCanManageDoctor(doctorId: string): Promise<DoctorAccess> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "DOCTOR",
  ]);

  const doctor = await prisma.doctorProfile.findFirst({
    where: { id: doctorId, tenantId },
    select: { id: true, userId: true, tenantId: true },
  });

  if (!doctor) {
    return { ok: false, error: "Doctor not found" };
  }

  if (membership.role === "DOCTOR" && doctor.userId !== session.user.id) {
    return { ok: false, error: "You can only manage your own profile" };
  }

  return { ok: true, session, membership, tenantId, doctor };
}

export async function createDoctorAction(
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN"]);
  const parsed = createDoctorSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { ok: false, error: "A user with this email already exists" };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    const userId = result.user.id;

    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: { tenantId, userId },
      },
      update: {
        role: "DOCTOR",
        status: "ACTIVE",
      },
      create: {
        tenantId,
        userId,
        role: "DOCTOR",
        status: "ACTIVE",
      },
    });

    await prisma.patientProfile.deleteMany({ where: { userId } });

    const doctor = await prisma.doctorProfile.create({
      data: {
        tenantId,
        userId,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber || null,
        bio: data.bio || null,
        consultationFee: parseFee(data.consultationFee),
        isAcceptingPatients: true,
      },
    });

    revalidatePath("/doctors");
    return { ok: true, doctorId: doctor.id };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Unable to create doctor account" };
  }
}

export async function updateDoctorProfileAction(
  doctorId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManageDoctor(doctorId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = doctorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  await prisma.doctorProfile.update({
    where: { id: doctorId },
    data: {
      specialty: data.specialty,
      licenseNumber: data.licenseNumber || null,
      bio: data.bio || null,
      consultationFee: parseFee(data.consultationFee),
      isAcceptingPatients: data.isAcceptingPatients,
    },
  });

  revalidatePath("/doctors");
  revalidatePath(`/doctors/${doctorId}`);
  return { ok: true, doctorId };
}

export async function createAvailabilityAction(
  doctorId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManageDoctor(doctorId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.doctorAvailability.create({
    data: {
      tenantId: access.tenantId,
      doctorProfileId: doctorId,
      ...parsed.data,
    },
  });

  revalidatePath(`/doctors/${doctorId}`);
  return { ok: true, doctorId };
}

export async function updateAvailabilityAction(
  availabilityId: string,
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN", "DOCTOR"]);

  const existing = await prisma.doctorAvailability.findFirst({
    where: { id: availabilityId, tenantId },
    include: { doctorProfile: true },
  });

  if (!existing) {
    return { ok: false, error: "Availability not found" };
  }

  const access = await assertCanManageDoctor(existing.doctorProfileId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.doctorAvailability.update({
    where: { id: availabilityId },
    data: parsed.data,
  });

  revalidatePath(`/doctors/${existing.doctorProfileId}`);
  return { ok: true, doctorId: existing.doctorProfileId };
}

export async function deleteAvailabilityAction(
  availabilityId: string,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN", "DOCTOR"]);

  const existing = await prisma.doctorAvailability.findFirst({
    where: { id: availabilityId, tenantId },
  });

  if (!existing) {
    return { ok: false, error: "Availability not found" };
  }

  const access = await assertCanManageDoctor(existing.doctorProfileId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await prisma.doctorAvailability.delete({
    where: { id: availabilityId },
  });

  revalidatePath(`/doctors/${existing.doctorProfileId}`);
  return { ok: true, doctorId: existing.doctorProfileId };
}

export async function toggleAvailabilityAction(
  availabilityId: string,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN", "DOCTOR"]);

  const existing = await prisma.doctorAvailability.findFirst({
    where: { id: availabilityId, tenantId },
  });

  if (!existing) {
    return { ok: false, error: "Availability not found" };
  }

  const access = await assertCanManageDoctor(existing.doctorProfileId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await prisma.doctorAvailability.update({
    where: { id: availabilityId },
    data: { isActive: !existing.isActive },
  });

  revalidatePath(`/doctors/${existing.doctorProfileId}`);
  return { ok: true, doctorId: existing.doctorProfileId };
}
