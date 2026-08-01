import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreatePatientForm } from "@/features/patients/components/create-patient-form";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Register patient",
};

export default async function NewPatientPage() {
  await requireTenantContext(["ADMIN", "RECEPTIONIST"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/patients"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Patients
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Register patient
        </h1>
        <p className="text-sm text-muted-foreground">
          Creates a patient login, membership, and demographic profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient account</CardTitle>
          <CardDescription>
            Share the temporary password securely with the patient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
