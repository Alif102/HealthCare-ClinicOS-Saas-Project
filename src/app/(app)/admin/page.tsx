import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClinicOverview,
  getRecentClinicActivity,
} from "@/features/admin/queries";
import { APPOINTMENT_STATUS_LABEL } from "@/features/appointments/constants";
import { INVOICE_STATUS_LABEL } from "@/features/billing/constants";
import { formatMoney } from "@/features/billing/money";
import {
  MEMBERSHIP_STATUS_LABEL,
  ROLE_LABEL,
} from "@/features/admin/constants";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage() {
  const { tenantId } = await requireTenantContext(["ADMIN"]);
  const [overview, activity] = await Promise.all([
    getClinicOverview(tenantId),
    getRecentClinicActivity(tenantId),
  ]);

  const metrics = [
    { label: "Active staff", value: overview.activeStaff },
    { label: "Doctors", value: overview.doctors },
    { label: "Patients", value: overview.patients },
    { label: "Visits today", value: overview.appointmentsToday },
    { label: "Open invoices", value: overview.pendingInvoices },
    { label: "Unread alerts", value: overview.unreadNotifications },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin · {overview.clinicName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinic settings, team, and a lightweight activity snapshot.
            {overview.clinicActive ? "" : " Clinic is marked inactive."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/settings"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Settings
          </Link>
          <Link href="/admin/team" className={cn(buttonVariants())}>
            Manage team
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {metric.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
            <CardDescription>Tenant-level toggles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              AI assist:{" "}
              <span className="font-medium text-foreground">
                {overview.aiAssistEnabled ? "Enabled" : "Disabled"}
              </span>
            </p>
            <p className="text-muted-foreground">
              Slug: <code>{overview.clinicSlug}</code>
            </p>
            <Link
              href="/admin/settings"
              className="text-sm text-teal-800 underline-offset-4 hover:underline"
            >
              Edit settings
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump into clinic operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              { href: "/reports", label: "Reports" },
              { href: "/billing", label: "Billing" },
              { href: "/doctors/new", label: "Add doctor" },
              { href: "/patients/new", label: "Register patient" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Snapshot from appointments, invoices, and memberships — not a full
            immutable audit log.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-medium">Appointments</h2>
            <ul className="space-y-2 text-sm">
              {activity.appointments.length === 0 ? (
                <li className="text-muted-foreground">No appointments yet.</li>
              ) : (
                activity.appointments.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span>
                      <Link
                        href={`/appointments/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.patientProfile.user.name}
                      </Link>{" "}
                      with {row.doctorProfile.user.name} ·{" "}
                      {APPOINTMENT_STATUS_LABEL[row.status]}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatWhen(row.updatedAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Invoices</h2>
            <ul className="space-y-2 text-sm">
              {activity.invoices.length === 0 ? (
                <li className="text-muted-foreground">No invoices yet.</li>
              ) : (
                activity.invoices.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span>
                      <Link
                        href={`/billing/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.invoiceNumber}
                      </Link>{" "}
                      · {row.patientProfile.user.name} ·{" "}
                      {INVOICE_STATUS_LABEL[row.status]} ·{" "}
                      {formatMoney(row.total, row.currency)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatWhen(row.updatedAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Team memberships</h2>
            <ul className="space-y-2 text-sm">
              {activity.memberships.map((row) => (
                <li key={row.id} className="flex justify-between gap-3">
                  <span>
                    {row.user.name} · {ROLE_LABEL[row.role]} ·{" "}
                    {MEMBERSHIP_STATUS_LABEL[row.status]}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatWhen(row.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
