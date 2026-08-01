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
import { DoctorProfileForm } from "@/features/doctors/components/doctor-profile-form";
import { getDoctorById } from "@/features/doctors/queries";
import { requireTenantContext } from "@/lib/auth-session";

type EditDoctorPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Edit doctor",
};

export default async function EditDoctorPage({ params }: EditDoctorPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "DOCTOR",
  ]);
  const doctor = await getDoctorById(tenantId, id);

  if (!doctor) {
    notFound();
  }

  if (membership.role === "DOCTOR" && doctor.userId !== session.user.id) {
    redirect(`/doctors/${doctor.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/doctors/${doctor.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {doctor.user.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinical profile</CardTitle>
          <CardDescription>
            Specialty, fees, and patient intake settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorProfileForm
            doctorId={doctor.id}
            defaultValues={{
              specialty: doctor.specialty,
              licenseNumber: doctor.licenseNumber ?? "",
              bio: doctor.bio ?? "",
              consultationFee: doctor.consultationFee?.toString() ?? "",
              isAcceptingPatients: doctor.isAcceptingPatients,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
