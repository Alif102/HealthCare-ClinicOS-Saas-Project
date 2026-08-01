import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GENDER_LABEL } from "@/features/patients/constants";
import { getPatientById } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PatientDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Patient · ${id.slice(0, 6)}` };
}

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const patient = await getPatientById(tenantId, id);

  if (!patient) {
    notFound();
  }

  if (
    membership.role === "PATIENT" &&
    patient.userId !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const canManage =
    membership.role === "ADMIN" ||
    membership.role === "RECEPTIONIST" ||
    (membership.role === "PATIENT" && patient.userId === session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {membership.role !== "PATIENT" ? (
            <Link
              href="/patients"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Patients
            </Link>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight">
            {patient.user.name}
          </h1>
          <p className="text-muted-foreground">{patient.user.email}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{GENDER_LABEL[patient.gender]}</Badge>
            {patient.bloodType ? (
              <Badge variant="outline">{patient.bloodType}</Badge>
            ) : null}
          </div>
        </div>
        {canManage ? (
          <Link
            href={`/patients/${patient.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit profile
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demographics</CardTitle>
            <CardDescription>Core patient identity details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Date of birth:</span>{" "}
              {patient.dateOfBirth
                ? patient.dateOfBirth.toISOString().slice(0, 10)
                : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {patient.phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {patient.address || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency & clinical summary</CardTitle>
            <CardDescription>
              History modules will expand these counters later
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Emergency contact:</span>{" "}
              {patient.emergencyContactName || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Emergency phone:</span>{" "}
              {patient.emergencyContactPhone || "—"}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-border/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Appointments</p>
                <p className="text-lg font-semibold">
                  {patient._count.appointments}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Prescriptions</p>
                <p className="text-lg font-semibold">
                  {patient._count.prescriptions}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Allergies</p>
                <p className="text-lg font-semibold">
                  {patient._count.allergies}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 px-3 py-2">
                <p className="text-xs text-muted-foreground">Conditions</p>
                <p className="text-lg font-semibold">
                  {patient._count.conditions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
