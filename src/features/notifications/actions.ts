"use server";

import { revalidatePath } from "next/cache";

import { notificationIdSchema } from "@/features/notifications/schemas";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateNotificationPaths() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationReadAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, tenantId } = await requireTenantContext();
  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification" };
  }

  const updated = await prisma.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      tenantId,
      userId: session.user.id,
      channel: "IN_APP",
    },
    data: { isRead: true },
  });

  if (updated.count === 0) {
    return { ok: false, error: "Notification not found" };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { session, tenantId } = await requireTenantContext();

  await prisma.notification.updateMany({
    where: {
      tenantId,
      userId: session.user.id,
      channel: "IN_APP",
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidateNotificationPaths();
  return { ok: true };
}
