import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";

import { AppointmentList } from "@/features/appointments/components/appointment-list";
import { APPOINTMENT_STATUS_OPTIONS } from "@/features/appointments/constants";
import { listAppointments } from "@/features/appointments/queries";
import { getDoctorByUserId, listDoctors } from "@/features/doctors/queries";
import { getPatientByUserId } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Appointments",
};

type AppointmentsPageProps = {
  searchParams: Promise<{
    status?: string;
    doctorProfileId?: string;
    from?: string;
    to?: string;
  }>;
};

function parseStatus(value?: string): AppointmentStatus | undefined {
  if (!value) return undefined;
  return APPOINTMENT_STATUS_OPTIONS.includes(
    value as (typeof APPOINTMENT_STATUS_OPTIONS)[number],
  )
    ? (value as AppointmentStatus)
    : undefined;
}

function defaultFrom() {
  return new Date().toISOString().slice(0, 10);
}

function defaultTo() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 14);
  return date.toISOString().slice(0, 10);
}

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const params = await searchParams;
  const { session, membership, tenantId } = await requireTenantContext();

  const from = params.from || defaultFrom();
  const to = params.to || defaultTo();
  const status = parseStatus(params.status);

  let doctorProfileId = params.doctorProfileId || undefined;
  let patientProfileId: string | undefined;
  let title = "Appointments";
  let description = "Clinic schedule for the selected range.";

  if (membership.role === "DOCTOR") {
    const me = await getDoctorByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/doctors/me");
    }
    doctorProfileId = me.id;
    title = "My schedule";
    description = "Appointments on your calendar only.";
  }

  if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/patients/me");
    }
    patientProfileId = me.id;
    doctorProfileId = undefined;
    title = "My appointments";
    description = "Your upcoming and recent visits.";
  }

  const appointments = await listAppointments(tenantId, {
    status,
    doctorProfileId,
    patientProfileId,
    from,
    to,
  });

  const doctors =
    membership.role === "ADMIN" || membership.role === "RECEPTIONIST"
      ? await listDoctors(tenantId)
      : [];

  const canBook = true;

  return (
    <AppointmentList
      appointments={appointments}
      canBook={canBook}
      showDoctorFilter={
        membership.role === "ADMIN" || membership.role === "RECEPTIONIST"
      }
      doctors={doctors.map((doctor) => ({
        id: doctor.id,
        user: { name: doctor.user.name },
      }))}
      filters={{
        status,
        doctorProfileId:
          membership.role === "ADMIN" || membership.role === "RECEPTIONIST"
            ? params.doctorProfileId
            : undefined,
        from,
        to,
      }}
      title={title}
      description={description}
    />
  );
}
