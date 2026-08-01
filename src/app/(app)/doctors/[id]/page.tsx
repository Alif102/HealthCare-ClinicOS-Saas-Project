import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityForm } from "@/features/doctors/components/availability-form";
import { AvailabilityList } from "@/features/doctors/components/availability-list";
import { getDoctorById } from "@/features/doctors/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type DoctorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DoctorDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Doctor · ${id.slice(0, 6)}` };
}

export default async function DoctorDetailPage({
  params,
}: DoctorDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const doctor = await getDoctorById(tenantId, id);

  if (!doctor) {
    notFound();
  }

  const canManage =
    membership.role === "ADMIN" ||
    (membership.role === "DOCTOR" && doctor.userId === session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/doctors"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Doctors
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            {doctor.user.name}
          </h1>
          <p className="text-muted-foreground">{doctor.user.email}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{doctor.specialty}</Badge>
            <Badge variant={doctor.isAcceptingPatients ? "default" : "outline"}>
              {doctor.isAcceptingPatients ? "Accepting patients" : "Not accepting"}
            </Badge>
          </div>
        </div>
        {canManage ? (
          <Link
            href={`/doctors/${doctor.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit profile
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Clinical details for this provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">License:</span>{" "}
              {doctor.licenseNumber || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Fee:</span>{" "}
              {doctor.consultationFee
                ? `$${doctor.consultationFee.toString()}`
                : "—"}
            </p>
            <p className="leading-relaxed">
              <span className="text-muted-foreground">Bio:</span>{" "}
              {doctor.bio || "No bio yet."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly availability</CardTitle>
            <CardDescription>
              Used later by the appointment booking engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvailabilityList
              rows={doctor.availabilities}
              canManage={canManage}
            />
            {canManage ? <AvailabilityForm doctorId={doctor.id} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
