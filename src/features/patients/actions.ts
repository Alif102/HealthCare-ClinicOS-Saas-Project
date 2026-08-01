"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth-session";
import {
  createPatientSchema,
  patientProfileSchema,
} from "@/features/patients/schemas";

type ActionResult =
  | { ok: true; patientId?: string }
  | { ok: false; error: string };

type PatientAccess =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof requireTenantContext>>["session"];
      membership: Awaited<ReturnType<typeof requireTenantContext>>["membership"];
      tenantId: string;
      patient: {
        id: string;
        userId: string;
        tenantId: string;
      };
    }
  | { ok: false; error: string };

function parseOptionalDate(value?: string) {
  if (!value || value.trim() === "") return null;
  return new Date(value);
}

async function assertCanManagePatient(patientId: string): Promise<PatientAccess> {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "PATIENT",
  ]);

  const patient = await prisma.patientProfile.findFirst({
    where: { id: patientId, tenantId },
    select: { id: true, userId: true, tenantId: true },
  });

  if (!patient) {
    return { ok: false, error: "Patient not found" };
  }

  if (membership.role === "PATIENT" && patient.userId !== session.user.id) {
    return { ok: false, error: "You can only manage your own profile" };
  }

  return { ok: true, session, membership, tenantId, patient };
}

export async function createPatientAction(
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN", "RECEPTIONIST"]);
  const parsed = createPatientSchema.safeParse(input);

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
        role: "PATIENT",
        status: "ACTIVE",
      },
      create: {
        tenantId,
        userId,
        role: "PATIENT",
        status: "ACTIVE",
      },
    });

    const patient = await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        tenantId,
        dateOfBirth: parseOptionalDate(data.dateOfBirth),
        gender: data.gender,
        bloodType: data.bloodType || null,
        phone: data.phone || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        address: data.address || null,
      },
      create: {
        tenantId,
        userId,
        dateOfBirth: parseOptionalDate(data.dateOfBirth),
        gender: data.gender,
        bloodType: data.bloodType || null,
        phone: data.phone || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        address: data.address || null,
      },
    });

    revalidatePath("/patients");
    return { ok: true, patientId: patient.id };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Unable to create patient account" };
  }
}

export async function updatePatientProfileAction(
  patientId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManagePatient(patientId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = patientProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: access.patient.userId },
      data: { name: data.name },
    }),
    prisma.patientProfile.update({
      where: { id: patientId },
      data: {
        dateOfBirth: parseOptionalDate(data.dateOfBirth),
        gender: data.gender,
        bloodType: data.bloodType || null,
        phone: data.phone || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        address: data.address || null,
      },
    }),
  ]);

  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, patientId };
}
