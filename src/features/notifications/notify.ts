import type { NotificationChannel, Prisma } from "@prisma/client";

import { isEmailConfigured, sendNotificationEmail } from "@/features/notifications/email";
import type { NotificationEvent } from "@/features/notifications/constants";
import { prisma } from "@/lib/db";

export type NotifyPayload = {
  tenantId: string;
  userId: string;
  title: string;
  body: string;
  event: NotificationEvent;
  href?: string;
  /** Extra JSON merged into metadata (never put PHI in here). */
  meta?: Record<string, string | number | boolean | null>;
  /** Default: IN_APP always; EMAIL when Resend is configured. */
  channels?: NotificationChannel[];
};

function buildMetadata(
  input: NotifyPayload,
  extra?: Record<string, string>,
): Prisma.InputJsonValue {
  return {
    event: input.event,
    ...(input.href ? { href: input.href } : {}),
    ...(input.meta ?? {}),
    ...(extra ?? {}),
  };
}

/**
 * Persist an in-app notification and optionally email the user.
 * Never throws — domain actions must not fail because alerting failed.
 */
export async function notifyUser(input: NotifyPayload): Promise<void> {
  try {
    const channels: NotificationChannel[] = input.channels ?? [
      "IN_APP",
      ...(isEmailConfigured() ? (["EMAIL"] as const) : []),
    ];

    const metadata = buildMetadata(input);

    if (channels.includes("IN_APP")) {
      await prisma.notification.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          channel: "IN_APP",
          title: input.title,
          body: input.body,
          metadata,
        },
      });
    }

    if (channels.includes("EMAIL") && isEmailConfigured()) {
      const user = await prisma.user.findFirst({
        where: { id: input.userId },
        select: { email: true },
      });

      if (!user?.email) return;

      const emailResult = await sendNotificationEmail({
        to: user.email,
        title: input.title,
        body: input.body,
      });

      // Audit trail row even when send fails — staff can see it was attempted.
      await prisma.notification.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          channel: "EMAIL",
          title: input.title,
          body: input.body,
          isRead: true,
          metadata: buildMetadata(
            input,
            emailResult.ok
              ? { emailStatus: "sent" }
              : { emailStatus: "failed", emailError: emailResult.error },
          ),
        },
      });
    }
  } catch (error) {
    console.error("[notifications] notifyUser failed", error);
  }
}

export async function notifyUsers(
  recipients: Array<Omit<NotifyPayload, "title" | "body" | "event" | "href" | "meta" | "channels"> & {
    userId: string;
  }>,
  shared: Omit<NotifyPayload, "userId" | "tenantId"> & { tenantId: string },
): Promise<void> {
  const uniqueIds = [...new Set(recipients.map((r) => r.userId))];
  await Promise.all(
    uniqueIds.map((userId) =>
      notifyUser({
        ...shared,
        userId,
      }),
    ),
  );
}
