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
import { BookAppointmentForm } from "@/features/appointments/components/book-appointment-form";
import { listAcceptingDoctors } from "@/features/appointments/queries";
import { getDoctorByUserId } from "@/features/doctors/queries";
import {
  getPatientByUserId,
  listPatients,
} from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Book appointment",
};

export default async function NewAppointmentPage() {
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
    "PATIENT",
  ]);

  const doctors = await listAcceptingDoctors(tenantId);
  let lockedDoctorId: string | undefined;
  let lockedPatientId: string | undefined;
  let patients: Awaited<ReturnType<typeof listPatients>> = [];

  if (membership.role === "DOCTOR") {
    const me = await getDoctorByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/doctors/me");
    }
    lockedDoctorId = me.id;
    patients = await listPatients(tenantId);
  } else if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/patients/me");
    }
    lockedPatientId = me.id;
    patients = [me];
  } else {
    patients = await listPatients(tenantId);
  }

  const bookableDoctors = lockedDoctorId
    ? doctors.filter((doctor) => doctor.id === lockedDoctorId)
    : doctors;

  if (bookableDoctors.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/appointments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Appointments
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Book appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          No doctors are currently accepting patients. Add availability and
          enable accepting patients on a doctor profile first.
        </p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/appointments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Appointments
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Book appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Register a patient before booking a visit.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/appointments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Appointments
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Book appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Open slots are generated from the doctor’s weekly availability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
          <CardDescription>
            Times shown in UTC (demo clinic timezone).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookAppointmentForm
            doctors={bookableDoctors}
            patients={patients.map((patient) => ({
              id: patient.id,
              user: {
                name: patient.user.name,
                email: patient.user.email,
              },
            }))}
            lockedDoctorId={lockedDoctorId}
            lockedPatientId={lockedPatientId}
            showNotes={membership.role !== "PATIENT"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
