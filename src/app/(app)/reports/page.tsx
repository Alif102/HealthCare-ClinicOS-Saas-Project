import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_TYPE_LABEL } from "@/features/appointments/constants";
import { getDoctorByUserId, listDoctors } from "@/features/doctors/queries";
import { PRESCRIPTION_STATUS_LABEL } from "@/features/prescriptions/constants";
import { BreakdownBars } from "@/features/reports/components/breakdown-bars";
import { DailyVolumeChart } from "@/features/reports/components/daily-volume-chart";
import { DoctorWorkloadTable } from "@/features/reports/components/doctor-workload-table";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { ReportSummaryCards } from "@/features/reports/components/report-summary-cards";
import {
  clampReportRange,
  defaultReportFrom,
  defaultReportTo,
} from "@/features/reports/constants";
import {
  getAppointmentStatusBreakdown,
  getAppointmentTypeBreakdown,
  getDailyAppointmentVolume,
  getDoctorWorkload,
  getPrescriptionStatusBreakdown,
  getReportSummary,
} from "@/features/reports/queries";
import { reportRangeSchema } from "@/features/reports/schemas";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Reports",
};

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    doctorProfileId?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR",
  ]);

  const parsed = reportRangeSchema.safeParse({
    from: params.from || defaultReportFrom(),
    to: params.to || defaultReportTo(),
    doctorProfileId: params.doctorProfileId || undefined,
  });

  const { from, to } = clampReportRange(
    parsed.success ? parsed.data.from : defaultReportFrom(),
    parsed.success ? parsed.data.to : defaultReportTo(),
  );

  let doctorProfileId: string | undefined;
  let title = "Clinic reports";
  let description =
    "Operational metrics across appointments, prescriptions, and visit notes.";
  let scopeLabel = "Clinic-wide";
  const isStaff =
    membership.role === "ADMIN" || membership.role === "RECEPTIONIST";

  if (membership.role === "DOCTOR") {
    const me = await getDoctorByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/doctors/me");
    }
    doctorProfileId = me.id;
    title = "My reports";
    description = "Your schedule load, prescriptions, and encounter notes.";
    scopeLabel = "Your practice";
  } else if (parsed.success && parsed.data.doctorProfileId) {
    doctorProfileId = parsed.data.doctorProfileId;
    scopeLabel = "Filtered doctor";
  }

  const scope = { tenantId, from, to, doctorProfileId };

  const [
    summary,
    statusBreakdown,
    typeBreakdown,
    rxBreakdown,
    dailyVolume,
    workload,
    doctors,
  ] = await Promise.all([
    getReportSummary(scope),
    getAppointmentStatusBreakdown(scope),
    getAppointmentTypeBreakdown(scope),
    getPrescriptionStatusBreakdown(scope),
    getDailyAppointmentVolume(scope),
    isStaff && !doctorProfileId
      ? getDoctorWorkload(tenantId, from, to)
      : Promise.resolve([]),
    isStaff ? listDoctors(tenantId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <ReportFilters
        from={from}
        to={to}
        doctorProfileId={
          membership.role === "DOCTOR" ? undefined : doctorProfileId
        }
        showDoctorFilter={isStaff}
        doctors={doctors.map((doctor) => ({
          id: doctor.id,
          user: { name: doctor.user.name },
        }))}
      />

      <ReportSummaryCards
        summary={summary}
        scopeLabel={`${scopeLabel} · ${from} → ${to} (UTC)`}
        showClinicRoster={isStaff && !doctorProfileId}
      />

      <DailyVolumeChart rows={dailyVolume} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownBars
          title="Appointments by status"
          description="Visit lifecycle in range"
          items={statusBreakdown.map((row) => ({
            key: row.key,
            label: APPOINTMENT_STATUS_LABEL[row.key],
            count: row.count,
          }))}
        />
        <BreakdownBars
          title="Appointments by type"
          description="Visit modality mix"
          items={typeBreakdown.map((row) => ({
            key: row.key,
            label: APPOINTMENT_TYPE_LABEL[row.key],
            count: row.count,
          }))}
        />
        <BreakdownBars
          title="Prescriptions by status"
          description="Orders created in range"
          items={rxBreakdown.map((row) => ({
            key: row.key,
            label: PRESCRIPTION_STATUS_LABEL[row.key],
            count: row.count,
          }))}
        />
      </div>

      {isStaff && !doctorProfileId ? (
        <DoctorWorkloadTable rows={workload} />
      ) : null}
    </div>
  );
}
