import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEncounterById } from "@/features/medical-history/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type EncounterDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EncounterDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Encounter · ${id.slice(0, 6)}` };
}

type Vitals = {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
};

function parseVitals(value: unknown): Vitals {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    bloodPressure:
      typeof record.bloodPressure === "string" ? record.bloodPressure : undefined,
    heartRate:
      typeof record.heartRate === "string" ? record.heartRate : undefined,
    temperature:
      typeof record.temperature === "string" ? record.temperature : undefined,
    weight: typeof record.weight === "string" ? record.weight : undefined,
  };
}

export default async function EncounterDetailPage({
  params,
}: EncounterDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const encounter = await getEncounterById(tenantId, id);

  if (!encounter) {
    notFound();
  }

  if (
    membership.role === "PATIENT" &&
    encounter.patientProfile.user.id !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const canEdit =
    membership.role === "DOCTOR" &&
    encounter.doctorProfile.user.id === session.user.id;
  const vitals = parseVitals(encounter.vitalsJson);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href={`/patients/${encounter.patientProfile.id}/history`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Medical history
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Visit notes
          </h1>
          <p className="text-sm text-muted-foreground">
            {encounter.patientProfile.user.name} ·{" "}
            {encounter.appointment.startAt.toISOString().slice(0, 10)} ·{" "}
            {encounter.doctorProfile.user.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/appointments/${encounter.appointment.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Appointment
          </Link>
          {canEdit ? (
            <Link
              href={`/appointments/${encounter.appointment.id}/encounter`}
              className={cn(buttonVariants())}
            >
              Edit notes
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chief complaint</CardTitle>
            <CardDescription>Reason for visit</CardDescription>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {encounter.chiefComplaint || "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vitals</CardTitle>
            <CardDescription>Recorded during the visit</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <p>
              <span className="text-muted-foreground">BP:</span>{" "}
              {vitals.bloodPressure || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">HR:</span>{" "}
              {vitals.heartRate || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Temp:</span>{" "}
              {vitals.temperature || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Weight:</span>{" "}
              {vitals.weight || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {encounter.assessment || "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {encounter.plan || "—"}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
