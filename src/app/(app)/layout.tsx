import { AppShell } from "@/features/shell/components/app-shell";
import { countUnreadNotifications } from "@/features/notifications/queries";
import {
  getActiveMembership,
  requireSession,
} from "@/lib/auth-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const membership = await getActiveMembership(
    session.user.id,
    session.session.activeTenantId,
  );

  const unreadCount =
    membership != null
      ? await countUnreadNotifications(membership.tenantId, session.user.id)
      : 0;

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      role={membership?.role}
      clinicName={membership?.tenant.name ?? "No clinic"}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
