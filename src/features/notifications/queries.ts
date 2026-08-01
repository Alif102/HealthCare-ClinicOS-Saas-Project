import { prisma } from "@/lib/db";

export type NotificationListFilters = {
  unreadOnly?: boolean;
  take?: number;
};

export async function listNotificationsForUser(
  tenantId: string,
  userId: string,
  filters: NotificationListFilters = {},
) {
  const take = Math.min(filters.take ?? 50, 100);

  return prisma.notification.findMany({
    where: {
      tenantId,
      userId,
      channel: "IN_APP",
      ...(filters.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnreadNotifications(
  tenantId: string,
  userId: string,
) {
  return prisma.notification.count({
    where: {
      tenantId,
      userId,
      channel: "IN_APP",
      isRead: false,
    },
  });
}

export async function getNotificationForUser(
  tenantId: string,
  userId: string,
  notificationId: string,
) {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      tenantId,
      userId,
      channel: "IN_APP",
    },
  });
}
