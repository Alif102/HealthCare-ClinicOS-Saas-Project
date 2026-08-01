import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PrescriptionForm } from "@/features/prescriptions/components/prescription-form";
import { listDoctorAppointmentsForRx } from "@/features/prescriptions/queries";
import { getDoctorByUserId } from "@/features/doctors/queries";
import { listPatients } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "New prescription",
};

type NewPrescriptionPageProps = {
  searchParams: Promise<{
    patientId?: string;
    appointmentId?: string;
  }>;
};

function formatAppointmentLabel(startAt: Date, patientName: string) {
  return `${startAt.toISOString().slice(0, 10)} · ${startAt
    .toISOString()
    .slice(11, 16)} UTC · ${patientName}`;
}

export default async function NewPrescriptionPage({
  searchParams,
}: NewPrescriptionPageProps) {
  const params = await searchParams;
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const doctor = await getDoctorByUserId(tenantId, session.user.id);

  if (!doctor) {
    redirect("/doctors/me");
  }

  const patients = await listPatients(tenantId);
  const appointments = await listDoctorAppointmentsForRx({
    tenantId,
    doctorProfileId: doctor.id,
  });

  if (patients.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/prescriptions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Prescriptions
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          New prescription
        </h1>
        <p className="text-sm text-muted-foreground">
          Register a patient before writing a prescription.
        </p>
      </div>
    );
  }

  const defaultPatientId =
    params.patientId &&
    patients.some((patient) => patient.id === params.patientId)
      ? params.patientId
      : undefined;

  const defaultAppointmentId =
    params.appointmentId &&
    appointments.some((row) => row.id === params.appointmentId)
      ? params.appointmentId
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/prescriptions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Prescriptions
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          New prescription
        </h1>
        <p className="text-sm text-muted-foreground">
          Saves as a draft. Issue it when the order is ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
          <CardDescription>
            Optionally link to an appointment that does not already have an Rx.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrescriptionForm
            mode="create"
            patients={patients.map((patient) => ({
              id: patient.id,
              user: {
                name: patient.user.name,
                email: patient.user.email,
              },
            }))}
            appointments={appointments.map((appointment) => ({
              id: appointment.id,
              startAt: appointment.startAt,
              patientProfileId: appointment.patientProfileId,
              label: formatAppointmentLabel(
                appointment.startAt,
                appointment.patientProfile.user.name,
              ),
            }))}
            defaultValues={{
              patientProfileId: defaultPatientId,
              appointmentId: defaultAppointmentId,
            }}
            lockPatient={Boolean(defaultPatientId)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
