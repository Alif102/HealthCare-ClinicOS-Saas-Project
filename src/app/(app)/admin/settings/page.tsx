import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClinicSettingsForm } from "@/features/admin/components/clinic-settings-form";
import { TIMEZONE_OPTIONS } from "@/features/admin/constants";
import { getTenantForAdmin } from "@/features/admin/queries";
import { isAiAssistEnabled } from "@/features/admin/settings";
import { requireTenantContext } from "@/lib/auth-session";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Clinic settings",
};

export default async function AdminSettingsPage() {
  const { tenantId } = await requireTenantContext(["ADMIN"]);
  const tenant = await getTenantForAdmin(tenantId);

  if (!tenant) {
    notFound();
  }

  const timezone = TIMEZONE_OPTIONS.includes(
    tenant.timezone as (typeof TIMEZONE_OPTIONS)[number],
  )
    ? (tenant.timezone as (typeof TIMEZONE_OPTIONS)[number])
    : "UTC";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Clinic settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Practice profile and feature toggles for{" "}
          <code className="text-foreground">{tenant.slug}</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile &amp; features</CardTitle>
          <CardDescription>
            Changes apply clinic-wide for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicSettingsForm
            defaultValues={{
              name: tenant.name,
              email: tenant.email ?? "",
              phone: tenant.phone ?? "",
              address: tenant.address ?? "",
              timezone,
              isActive: tenant.isActive,
              aiAssistEnabled: isAiAssistEnabled(tenant.settings),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
