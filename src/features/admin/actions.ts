"use server";

import { revalidatePath } from "next/cache";

import {
  clinicSettingsSchema,
  inviteStaffSchema,
  updateMembershipSchema,
} from "@/features/admin/schemas";
import { mergeTenantSettings } from "@/features/admin/settings";
import { auth } from "@/lib/auth";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type ActionResult =
  | { ok: true; membershipId?: string }
  | { ok: false; error: string };

function revalidateAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/team");
  revalidatePath("/dashboard");
  revalidatePath("/ai");
}

export async function updateClinicSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN"]);
  const parsed = clinicSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const current = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      timezone: data.timezone,
      isActive: data.isActive,
      settings: mergeTenantSettings(current?.settings, {
        aiAssistEnabled: data.aiAssistEnabled,
      }),
    },
  });

  revalidateAdminPaths();
  return { ok: true };
}

export async function inviteStaffAction(
  input: unknown,
): Promise<ActionResult> {
  const { tenantId } = await requireTenantContext(["ADMIN"]);
  const parsed = inviteStaffSchema.safeParse(input);
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

    // Public sign-up hook may create PATIENT membership + profile — replace.
    await prisma.patientProfile.deleteMany({ where: { userId } });

    const membership = await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: { tenantId, userId },
      },
      update: {
        role: data.role,
        status: "ACTIVE",
      },
      create: {
        tenantId,
        userId,
        role: data.role,
        status: "ACTIVE",
      },
    });

    revalidateAdminPaths();
    return { ok: true, membershipId: membership.id };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Unable to invite staff member" };
  }
}

export async function updateMembershipAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, tenantId } = await requireTenantContext(["ADMIN"]);
  const parsed = updateMembershipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!parsed.data.role && !parsed.data.status) {
    return { ok: false, error: "Nothing to update" };
  }

  const membership = await prisma.tenantMembership.findFirst({
    where: { id: parsed.data.membershipId, tenantId },
  });

  if (!membership) {
    return { ok: false, error: "Membership not found" };
  }

  if (
    membership.userId === session.user.id &&
    parsed.data.status &&
    parsed.data.status !== "ACTIVE"
  ) {
    return { ok: false, error: "You cannot suspend your own account" };
  }

  if (
    membership.userId === session.user.id &&
    parsed.data.role &&
    parsed.data.role !== "ADMIN"
  ) {
    return { ok: false, error: "You cannot remove your own admin role" };
  }

  const nextRole = parsed.data.role ?? membership.role;
  const nextStatus = parsed.data.status ?? membership.status;

  // Doctor/Patient roles are managed via their modules — only staff roles here.
  if (
    (membership.role === "DOCTOR" || membership.role === "PATIENT") &&
    parsed.data.role
  ) {
    return {
      ok: false,
      error: "Change doctor/patient accounts from their modules, not here",
    };
  }

  if (
    membership.role === "ADMIN" &&
    membership.status === "ACTIVE" &&
    (nextRole !== "ADMIN" || nextStatus !== "ACTIVE")
  ) {
    const otherAdmins = await prisma.tenantMembership.count({
      where: {
        tenantId,
        role: "ADMIN",
        status: "ACTIVE",
        id: { not: membership.id },
      },
    });
    if (otherAdmins === 0) {
      return { ok: false, error: "Keep at least one active admin" };
    }
  }

  await prisma.tenantMembership.update({
    where: { id: membership.id },
    data: {
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  revalidateAdminPaths();
  return { ok: true, membershipId: membership.id };
}
