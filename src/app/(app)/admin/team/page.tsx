import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteStaffForm } from "@/features/admin/components/invite-staff-form";
import { MembershipTable } from "@/features/admin/components/membership-table";
import { listMemberships } from "@/features/admin/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Team",
};

export default async function AdminTeamPage() {
  const { session, tenantId } = await requireTenantContext(["ADMIN"]);
  const memberships = await listMemberships(tenantId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Invite admins and receptionists, and manage staff membership status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite staff</CardTitle>
          <CardDescription>
            Creates a login and clinic membership. Use Doctors / Patients modules
            for clinical roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteStaffForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {memberships.length} membership
            {memberships.length === 1 ? "" : "s"} in this clinic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembershipTable
            memberships={memberships}
            currentUserId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
