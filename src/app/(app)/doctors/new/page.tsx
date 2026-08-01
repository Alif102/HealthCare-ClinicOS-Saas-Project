import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateDoctorForm } from "@/features/doctors/components/create-doctor-form";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Add doctor",
};

export default async function NewDoctorPage() {
  await requireTenantContext(["ADMIN"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/doctors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Doctors
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Add doctor</h1>
        <p className="text-sm text-muted-foreground">
          Creates a login account, DOCTOR membership, and clinical profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor account</CardTitle>
          <CardDescription>
            Share the temporary password securely with the clinician.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDoctorForm />
        </CardContent>
      </Card>
    </div>
  );
}
