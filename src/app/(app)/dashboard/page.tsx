import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAppointments } from "@/features/appointments/queries";
import { getDoctorByUserId, listDoctors } from "@/features/doctors/queries";
import {
  getPatientByUserId,
  listPatients,
} from "@/features/patients/queries";
import { listPrescriptions } from "@/features/prescriptions/queries";
import {
  getActiveMembership,
  requireSession,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const membership = await getActiveMembership(
    session.user.id,
    session.session.activeTenantId,
  );

  const isPatient = membership?.role === "PATIENT";
  const doctors = membership ? await listDoctors(membership.tenantId) : [];
  const patients =
    membership && !isPatient ? await listPatients(membership.tenantId) : [];

  const from = new Date().toISOString().slice(0, 10);
  const toDate = new Date();
  toDate.setUTCDate(toDate.getUTCDate() + 7);
  const to = toDate.toISOString().slice(0, 10);

  let upcomingCount = 0;
  let prescriptionCount = 0;
  if (membership) {
    if (membership.role === "DOCTOR") {
      const me = await getDoctorByUserId(membership.tenantId, session.user.id);
      const rows = me
        ? await listAppointments(membership.tenantId, {
            from,
            to,
            doctorProfileId: me.id,
            take: 10,
          })
        : [];
      upcomingCount = rows.length;
      const rx = me
        ? await listPrescriptions(membership.tenantId, {
            doctorProfileId: me.id,
            take: 10,
          })
        : [];
      prescriptionCount = rx.length;
    } else if (membership.role === "PATIENT") {
      const me = await getPatientByUserId(membership.tenantId, session.user.id);
      const rows = me
        ? await listAppointments(membership.tenantId, {
            from,
            to,
            patientProfileId: me.id,
            take: 10,
          })
        : [];
      upcomingCount = rows.length;
      const rx = me
        ? await listPrescriptions(membership.tenantId, {
            patientProfileId: me.id,
            take: 10,
          })
        : [];
      prescriptionCount = rx.length;
    } else {
      const rows = await listAppointments(membership.tenantId, {
        from,
        to,
        take: 10,
      });
      upcomingCount = rows.length;
      const rx = await listPrescriptions(membership.tenantId, { take: 10 });
      prescriptionCount = rx.length;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Clinic overview — doctors, patients, appointments, and prescriptions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Better Auth session + tenant context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">User:</span>{" "}
              {session.user.name}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {session.user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Role:</span>{" "}
              {membership?.role ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Clinic:</span>{" "}
              {membership?.tenant.name ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              {upcomingCount} in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Book visits from doctor availability and manage status.
            </p>
            <Link
              href="/appointments"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open appointments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
            <CardDescription>
              {prescriptionCount} recent order{prescriptionCount === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Draft, issue, and track medication orders.
            </p>
            <Link
              href="/prescriptions"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open prescriptions
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctors</CardTitle>
            <CardDescription>
              {doctors.length} clinician{doctors.length === 1 ? "" : "s"} in this
              clinic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Profiles, specialties, and weekly availability.
            </p>
            <Link
              href="/doctors"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open doctors
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patients</CardTitle>
            <CardDescription>
              {isPatient
                ? "Your demographic profile"
                : `${patients.length} patient${patients.length === 1 ? "" : "s"} on file`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isPatient
                ? "View and update your contact details."
                : "Register patients and maintain demographics."}
            </p>
            <Link
              href={isPatient ? "/patients/me" : "/patients"}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {isPatient ? "My profile" : "Open patients"}
            </Link>
          </CardContent>
        </Card>

        {!isPatient ? (
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Appointment volume, Rx mix, and clinician workload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Date-ranged operational metrics for the clinic (or your own
                panel if you are a doctor).
              </p>
              <Link
                href="/reports"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Open reports
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
