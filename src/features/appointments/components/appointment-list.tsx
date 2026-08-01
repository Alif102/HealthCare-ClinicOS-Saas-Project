import Link from "next/link";
import type { AppointmentStatus, AppointmentType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_LABEL,
} from "@/features/appointments/constants";
import { cn } from "@/lib/utils";

type AppointmentListItem = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string | null;
  doctorProfile: {
    id: string;
    specialty: string;
    user: { name: string };
  };
  patientProfile: {
    id: string;
    user: { name: string };
  };
};

type DoctorOption = {
  id: string;
  user: { name: string };
};

type AppointmentListProps = {
  appointments: AppointmentListItem[];
  canBook: boolean;
  showDoctorFilter: boolean;
  doctors: DoctorOption[];
  filters: {
    status?: string;
    doctorProfileId?: string;
    from?: string;
    to?: string;
  };
  title?: string;
  description?: string;
};

function formatWhen(start: Date, end: Date) {
  const date = start.toISOString().slice(0, 10);
  const startTime = start.toISOString().slice(11, 16);
  const endTime = end.toISOString().slice(11, 16);
  return `${date} · ${startTime}–${endTime} UTC`;
}

function statusVariant(
  status: AppointmentStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive";
    case "COMPLETED":
      return "secondary";
    case "IN_PROGRESS":
    case "CHECKED_IN":
      return "default";
    default:
      return "outline";
  }
}

export function AppointmentList({
  appointments,
  canBook,
  showDoctorFilter,
  doctors,
  filters,
  title = "Appointments",
  description = "Clinic schedule generated from doctor availability.",
}: AppointmentListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {canBook ? (
          <Link href="/appointments/new" className={cn(buttonVariants())}>
            Book appointment
          </Link>
        ) : null}
      </div>

      <form
        className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2 lg:grid-cols-5"
        action="/appointments"
        method="get"
      >
        <div className="space-y-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All statuses</option>
            {APPOINTMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {APPOINTMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        {showDoctorFilter ? (
          <div className="space-y-1">
            <label
              htmlFor="doctorProfileId"
              className="text-xs text-muted-foreground"
            >
              Doctor
            </label>
            <select
              id="doctorProfileId"
              name="doctorProfileId"
              defaultValue={filters.doctorProfileId ?? ""}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Filter
          </button>
        </div>
      </form>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No appointments found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canBook
              ? "Book the first visit using an open availability slot."
              : "Nothing matches these filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <Link
                      href={`/appointments/${appointment.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {formatWhen(appointment.startAt, appointment.endAt)}
                    </Link>
                    {appointment.reason ? (
                      <p className="text-xs text-muted-foreground">
                        {appointment.reason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{appointment.patientProfile.user.name}</TableCell>
                  <TableCell>
                    <p>{appointment.doctorProfile.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.doctorProfile.specialty}
                    </p>
                  </TableCell>
                  <TableCell>
                    {APPOINTMENT_TYPE_LABEL[appointment.type]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(appointment.status)}>
                      {APPOINTMENT_STATUS_LABEL[appointment.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
