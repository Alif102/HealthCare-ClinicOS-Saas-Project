import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@/types/roles";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function getActiveMembership(userId: string, tenantId?: string | null) {
  if (tenantId) {
    return prisma.tenantMembership.findFirst({
      where: {
        userId,
        tenantId,
        status: "ACTIVE",
      },
      include: {
        tenant: true,
      },
    });
  }

  return prisma.tenantMembership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
    include: {
      tenant: true,
    },
  });
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  const membership = await getActiveMembership(
    session.user.id,
    session.session.activeTenantId,
  );

  if (!membership || !allowed.includes(membership.role)) {
    redirect("/dashboard");
  }

  return { session, membership };
}

/**
 * Requires an authenticated user with an active clinic membership.
 * Optionally restricts by role. Always returns a trusted tenantId.
 */
export async function requireTenantContext(allowed?: Role[]) {
  const session = await requireSession();
  const membership = await getActiveMembership(
    session.user.id,
    session.session.activeTenantId,
  );

  if (!membership) {
    redirect("/dashboard");
  }

  if (allowed && !allowed.includes(membership.role)) {
    redirect("/dashboard");
  }

  return {
    session,
    membership,
    tenantId: membership.tenantId,
  };
}
