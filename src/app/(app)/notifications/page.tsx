import type { Metadata } from "next";

import { NotificationList } from "@/features/notifications/components/notification-list";
import { isEmailConfigured } from "@/features/notifications/email";
import {
  countUnreadNotifications,
  listNotificationsForUser,
} from "@/features/notifications/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const { session, tenantId } = await requireTenantContext();

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(tenantId, session.user.id),
    countUnreadNotifications(tenantId, session.user.id),
  ]);

  return (
    <NotificationList
      notifications={notifications}
      unreadCount={unreadCount}
      emailEnabled={isEmailConfigured()}
    />
  );
}
