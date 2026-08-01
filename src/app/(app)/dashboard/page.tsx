import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  Receipt,
  Shield,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  Video,
  ArrowUpRight,
} from "lucide-react";

import { listAppointments } from "@/features/appointments/queries";
import { listInvoices } from "@/features/billing/queries";
import { getDoctorByUserId, listDoctors } from "@/features/doctors/queries";
import { countUnreadNotifications } from "@/features/notifications/queries";
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

type Tone =
  | "teal"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "emerald"
  | "cyan"
  | "orange";

const toneStyles: Record<
  Tone,
  { card: string; icon: string; value: string; chip: string }
> = {
  teal: {
    card: "border-teal-200/80 bg-gradient-to-br from-teal-50 to-white",
    icon: "bg-teal-600 text-white",
    value: "text-teal-900",
    chip: "bg-teal-100 text-teal-800",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white",
    icon: "bg-sky-600 text-white",
    value: "text-sky-900",
    chip: "bg-sky-100 text-sky-800",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
    icon: "bg-amber-500 text-white",
    value: "text-amber-950",
    chip: "bg-amber-100 text-amber-900",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 to-white",
    icon: "bg-rose-500 text-white",
    value: "text-rose-950",
    chip: "bg-rose-100 text-rose-800",
  },
  violet: {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white",
    icon: "bg-indigo-600 text-white",
    value: "text-indigo-950",
    chip: "bg-indigo-100 text-indigo-800",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
    icon: "bg-emerald-600 text-white",
    value: "text-emerald-950",
    chip: "bg-emerald-100 text-emerald-800",
  },
  cyan: {
    card: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-white",
    icon: "bg-cyan-600 text-white",
    value: "text-cyan-950",
    chip: "bg-cyan-100 text-cyan-800",
  },
  orange: {
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white",
    icon: "bg-orange-500 text-white",
    value: "text-orange-950",
    chip: "bg-orange-100 text-orange-900",
  },
};

function StatCard({
  label,
  value,
  hint,
  href,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  href: string;
  tone: Tone;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const styles = toneStyles[tone];
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl shadow-sm",
            styles.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <ArrowUpRight className="size-4 text-current opacity-30 transition-opacity group-hover:opacity-70" />
      </div>
      <p className={cn("mt-5 text-3xl font-semibold tracking-tight", styles.value)}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </Link>
  );
}

function ModuleTile({
  title,
  description,
  href,
  tone,
  icon: Icon,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  tone: Tone;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  cta: string;
}) {
  const styles = toneStyles[tone];
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        styles.card,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <span
        className={cn(
          "mt-4 inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5",
          styles.chip,
        )}
      >
        {cta}
        <ArrowUpRight className="size-3.5" />
      </span>
    </Link>
  );
}

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
  const patientCount = patients.length;

  const from = new Date().toISOString().slice(0, 10);
  const toDate = new Date();
  toDate.setUTCDate(toDate.getUTCDate() + 7);
  const to = toDate.toISOString().slice(0, 10);

  let upcomingCount = 0;
  let prescriptionCount = 0;
  let invoiceCount = 0;
  let unreadNotifications = 0;
  if (membership) {
    unreadNotifications = await countUnreadNotifications(
      membership.tenantId,
      session.user.id,
    );
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
      const invoices = me
        ? await listInvoices(membership.tenantId, {
            patientProfileId: me.id,
            take: 10,
          })
        : [];
      invoiceCount = invoices.length;
    } else {
      const rows = await listAppointments(membership.tenantId, {
        from,
        to,
        take: 10,
      });
      upcomingCount = rows.length;
      const rx = await listPrescriptions(membership.tenantId, { take: 10 });
      prescriptionCount = rx.length;
      const invoices = await listInvoices(membership.tenantId, { take: 10 });
      invoiceCount = invoices.length;
    }
  }

  const firstName = session.user.name.split(" ")[0] ?? session.user.name;
  const roleLabel = membership?.role ?? "MEMBER";
  const clinicName = membership?.tenant.name ?? "your clinic";

  const showBilling =
    membership?.role === "ADMIN" ||
    membership?.role === "RECEPTIONIST" ||
    membership?.role === "PATIENT";

  return (
    <div className="space-y-8">
      {/* Colorful welcome hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-7 text-white shadow-md sm:px-8 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-amber-300/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-sky-300/30 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.5px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-100/90">
              {clinicName}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Good to see you, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-50/85 sm:text-base">
              Your clinic overview — appointments, charts, billing, and care
              tools in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
              {roleLabel}
            </span>
            <span className="rounded-lg bg-amber-300/25 px-3 py-1.5 text-xs font-semibold text-amber-50 backdrop-blur-sm">
              {unreadNotifications} unread alert
              {unreadNotifications === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      {/* Metric strip */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            At a glance
          </h2>
          <p className="text-xs text-slate-500">Next 7 days · recent activity</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Appointments"
            value={upcomingCount}
            hint="Upcoming this week"
            href="/appointments"
            tone="teal"
            icon={CalendarDays}
          />
          <StatCard
            label="Prescriptions"
            value={prescriptionCount}
            hint="Recent orders"
            href="/prescriptions"
            tone="violet"
            icon={FileText}
          />
          <StatCard
            label="Alerts"
            value={unreadNotifications}
            hint="Unread notifications"
            href="/notifications"
            tone="amber"
            icon={Bell}
          />
          {showBilling ? (
            <StatCard
              label="Invoices"
              value={invoiceCount}
              hint="Recent billing"
              href="/billing"
              tone="rose"
              icon={Receipt}
            />
          ) : (
            <StatCard
              label="Doctors"
              value={doctors.length}
              hint="Clinicians on roster"
              href="/doctors"
              tone="sky"
              icon={Stethoscope}
            />
          )}
        </div>
      </section>

      {/* Module grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Jump into a module
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Color-coded shortcuts for your role in {clinicName}.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleTile
            title="Appointments"
            description="Book visits from doctor availability and manage status."
            href="/appointments"
            tone="teal"
            icon={CalendarDays}
            cta="Open schedule"
          />
          <ModuleTile
            title="Prescriptions"
            description="Draft, issue, and track medication orders."
            href="/prescriptions"
            tone="violet"
            icon={FileText}
            cta="Open Rx"
          />
          <ModuleTile
            title="Doctors"
            description="Profiles, specialties, and weekly availability."
            href="/doctors"
            tone="sky"
            icon={Stethoscope}
            cta="Open doctors"
          />
          <ModuleTile
            title={isPatient ? "My profile" : "Patients"}
            description={
              isPatient
                ? "View and update your contact details."
                : `${patientCount} patient${patientCount === 1 ? "" : "s"} on file — register and maintain demographics.`
            }
            href={isPatient ? "/patients/me" : "/patients"}
            tone="emerald"
            icon={isPatient ? UserRound : Users}
            cta={isPatient ? "My profile" : "Open patients"}
          />
          {!isPatient ? (
            <ModuleTile
              title="Reports"
              description="Appointment volume, Rx mix, and clinician workload."
              href="/reports"
              tone="orange"
              icon={BarChart3}
              cta="Open reports"
            />
          ) : null}
          {showBilling ? (
            <ModuleTile
              title="Billing"
              description={
                membership?.role === "PATIENT"
                  ? "View charges for your visits."
                  : "Create invoices and record clinic payments."
              }
              href="/billing"
              tone="rose"
              icon={Receipt}
              cta="Open billing"
            />
          ) : null}
          <ModuleTile
            title="Video"
            description="Prepare and join video visits for telehealth appointments."
            href="/video"
            tone="cyan"
            icon={Video}
            cta="Open video"
          />
          <ModuleTile
            title="Alerts"
            description="Bookings, invoices, prescriptions, and video room updates."
            href="/notifications"
            tone="amber"
            icon={Bell}
            cta="Open alerts"
          />
          {membership?.role === "DOCTOR" ? (
            <ModuleTile
              title="AI Assist"
              description="Draft visit notes and Rx suggestions for clinicians."
              href="/ai"
              tone="violet"
              icon={Sparkles}
              cta="Open AI"
            />
          ) : null}
          {membership?.role === "ADMIN" ? (
            <ModuleTile
              title="Admin"
              description="Clinic settings, team invites, and activity snapshot."
              href="/admin"
              tone="teal"
              icon={Shield}
              cta="Open admin"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
