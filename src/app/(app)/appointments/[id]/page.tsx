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
import { AppointmentStatusActions } from "@/features/appointments/components/appointment-status-actions";
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_TYPE_LABEL,
} from "@/features/appointments/constants";
import { getAppointmentById } from "@/features/appointments/queries";
import { PRESCRIPTION_STATUS_LABEL } from "@/features/prescriptions/constants";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type AppointmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: AppointmentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Appointment · ${id.slice(0, 6)}` };
}

function formatWhen(start: Date, end: Date) {
  return `${start.toISOString().slice(0, 10)} · ${start
    .toISOString()
    .slice(11, 16)}–${end.toISOString().slice(11, 16)} UTC`;
}

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const appointment = await getAppointmentById(tenantId, id);

  if (!appointment) {
    notFound();
  }

  if (
    membership.role === "DOCTOR" &&
    appointment.doctorProfile.user.id !== session.user.id
  ) {
    redirect("/appointments");
  }

  if (
    membership.role === "PATIENT" &&
    appointment.patientProfile.user.id !== session.user.id
  ) {
    redirect("/appointments");
  }

  const mode = membership.role === "PATIENT" ? "patient" : "staff";
  const canWriteRx =
    membership.role === "DOCTOR" &&
    appointment.doctorProfile.user.id === session.user.id;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/appointments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Appointments
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {formatWhen(appointment.startAt, appointment.endAt)}
          </h1>
          <Badge variant="outline">
            {APPOINTMENT_STATUS_LABEL[appointment.status]}
          </Badge>
          <Badge variant="secondary">
            {APPOINTMENT_TYPE_LABEL[appointment.type]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visit</CardTitle>
            <CardDescription>Who and why</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Patient:</span>{" "}
              <Link
                href={`/patients/${appointment.patientProfile.id}`}
                className="font-medium hover:underline"
              >
                {appointment.patientProfile.user.name}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Doctor:</span>{" "}
              <Link
                href={`/doctors/${appointment.doctorProfile.id}`}
                className="font-medium hover:underline"
              >
                {appointment.doctorProfile.user.name}
              </Link>{" "}
              · {appointment.doctorProfile.specialty}
            </p>
            <p>
              <span className="text-muted-foreground">Reason:</span>{" "}
              {appointment.reason || "—"}
            </p>
            {membership.role !== "PATIENT" ? (
              <p>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {appointment.notes || "—"}
              </p>
            ) : null}
            {appointment.cancellationReason ? (
              <p>
                <span className="text-muted-foreground">
                  Cancellation reason:
                </span>{" "}
                {appointment.cancellationReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Advance the visit through the clinic workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentStatusActions
              appointmentId={appointment.id}
              status={appointment.status}
              mode={mode}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
            <CardDescription>
              Medication orders linked to this visit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointment.prescription ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">
                  {PRESCRIPTION_STATUS_LABEL[appointment.prescription.status]}
                </Badge>
                <Link
                  href={`/prescriptions/${appointment.prescription.id}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Open prescription
                </Link>
              </div>
            ) : canWriteRx ? (
              <Link
                href={`/prescriptions/new?patientId=${appointment.patientProfileId}&appointmentId=${appointment.id}`}
                className={cn(buttonVariants())}
              >
                Write prescription
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                No prescription linked to this visit yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
