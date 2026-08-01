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
import { PatientProfileForm } from "@/features/patients/components/patient-profile-form";
import { getPatientById } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

type EditPatientPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Edit patient",
};

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "PATIENT",
  ]);
  const patient = await getPatientById(tenantId, id);

  if (!patient) {
    notFound();
  }

  if (membership.role === "PATIENT" && patient.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/patients/${patient.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {patient.user.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit patient</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
          <CardDescription>
            Contact details and identity information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientProfileForm
            patientId={patient.id}
            defaultValues={{
              name: patient.user.name,
              dateOfBirth: patient.dateOfBirth
                ? patient.dateOfBirth.toISOString().slice(0, 10)
                : "",
              gender: patient.gender,
              bloodType: patient.bloodType ?? "",
              phone: patient.phone ?? "",
              emergencyContactName: patient.emergencyContactName ?? "",
              emergencyContactPhone: patient.emergencyContactPhone ?? "",
              address: patient.address ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
