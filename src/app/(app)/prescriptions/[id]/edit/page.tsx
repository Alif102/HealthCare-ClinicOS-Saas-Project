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
import { PrescriptionForm } from "@/features/prescriptions/components/prescription-form";
import {
  getPrescriptionById,
  listDoctorAppointmentsForRx,
} from "@/features/prescriptions/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Edit prescription",
};

type EditPrescriptionPageProps = {
  params: Promise<{ id: string }>;
};

function formatAppointmentLabel(startAt: Date, patientName: string) {
  return `${startAt.toISOString().slice(0, 10)} · ${startAt
    .toISOString()
    .slice(11, 16)} UTC · ${patientName}`;
}

export default async function EditPrescriptionPage({
  params,
}: EditPrescriptionPageProps) {
  const { id } = await params;
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const prescription = await getPrescriptionById(tenantId, id);

  if (!prescription) {
    notFound();
  }

  if (prescription.doctorProfile.user.id !== session.user.id) {
    redirect("/prescriptions");
  }

  if (prescription.status !== "DRAFT") {
    redirect(`/prescriptions/${prescription.id}`);
  }

  const appointments = await listDoctorAppointmentsForRx({
    tenantId,
    doctorProfileId: prescription.doctorProfileId,
    patientProfileId: prescription.patientProfileId,
  });

  const appointmentOptions = [
    ...(prescription.appointment
      ? [
          {
            id: prescription.appointment.id,
            startAt: prescription.appointment.startAt,
            patientProfileId: prescription.patientProfileId,
            label: formatAppointmentLabel(
              prescription.appointment.startAt,
              prescription.patientProfile.user.name,
            ),
          },
        ]
      : []),
    ...appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt,
      patientProfileId: appointment.patientProfileId,
      label: formatAppointmentLabel(
        appointment.startAt,
        appointment.patientProfile.user.name,
      ),
    })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/prescriptions/${prescription.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Prescription
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit draft</h1>
        <p className="text-sm text-muted-foreground">
          Medications can only be changed while the Rx is still a draft.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft details</CardTitle>
          <CardDescription>
            Patient is locked; you may retarget the linked appointment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrescriptionForm
            mode="edit"
            prescriptionId={prescription.id}
            patients={[
              {
                id: prescription.patientProfile.id,
                user: {
                  name: prescription.patientProfile.user.name,
                  email: prescription.patientProfile.user.email,
                },
              },
            ]}
            appointments={appointmentOptions}
            defaultValues={{
              patientProfileId: prescription.patientProfileId,
              appointmentId: prescription.appointmentId ?? "",
              notes: prescription.notes ?? "",
              items: prescription.items.map((item) => ({
                medicationName: item.medicationName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration ?? "",
                instructions: item.instructions ?? "",
                quantity:
                  item.quantity === null || item.quantity === undefined
                    ? ""
                    : String(item.quantity),
              })),
            }}
            lockPatient
          />
        </CardContent>
      </Card>
    </div>
  );
}
