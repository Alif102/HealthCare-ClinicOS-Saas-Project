import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EncounterForm } from "@/features/medical-history/components/encounter-form";
import { getEncounterByAppointmentId } from "@/features/medical-history/queries";
import { getAppointmentById } from "@/features/appointments/queries";
import { requireTenantContext } from "@/lib/auth-session";

type EncounterEditorPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Visit notes",
};

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
      typeof record.bloodPressure === "string" ? record.bloodPressure : "",
    heartRate: typeof record.heartRate === "string" ? record.heartRate : "",
    temperature:
      typeof record.temperature === "string" ? record.temperature : "",
    weight: typeof record.weight === "string" ? record.weight : "",
  };
}

export default async function AppointmentEncounterPage({
  params,
}: EncounterEditorPageProps) {
  const { id } = await params;
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const appointment = await getAppointmentById(tenantId, id);

  if (!appointment) {
    notFound();
  }

  if (appointment.doctorProfile.user.id !== session.user.id) {
    redirect(`/appointments/${id}`);
  }

  const encounter = await getEncounterByAppointmentId(tenantId, id);
  const vitals = parseVitals(encounter?.vitalsJson);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/appointments/${appointment.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Appointment
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Visit notes</h1>
        <p className="text-sm text-muted-foreground">
          {appointment.patientProfile.user.name} ·{" "}
          {appointment.startAt.toISOString().slice(0, 10)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {encounter ? "Update encounter" : "Document encounter"}
          </CardTitle>
          <CardDescription>
            One set of visit notes per appointment. Patients can view after
            save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EncounterForm
            appointmentId={appointment.id}
            defaultValues={{
              chiefComplaint: encounter?.chiefComplaint ?? "",
              assessment: encounter?.assessment ?? "",
              plan: encounter?.plan ?? "",
              ...vitals,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
