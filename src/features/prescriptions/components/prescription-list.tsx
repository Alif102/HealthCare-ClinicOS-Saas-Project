import Link from "next/link";
import type { PrescriptionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PRESCRIPTION_STATUS_LABEL,
  PRESCRIPTION_STATUS_OPTIONS,
} from "@/features/prescriptions/constants";
import { cn } from "@/lib/utils";

type PrescriptionListItem = {
  id: string;
  status: PrescriptionStatus;
  issuedAt: Date | null;
  createdAt: Date;
  _count: { items: number };
  doctorProfile: {
    user: { name: string };
  };
  patientProfile: {
    user: { name: string };
  };
  appointment: {
    id: string;
    startAt: Date;
  } | null;
};

type PrescriptionListProps = {
  prescriptions: PrescriptionListItem[];
  canCreate: boolean;
  filters: {
    status?: string;
  };
  title?: string;
  description?: string;
};

function statusVariant(
  status: PrescriptionStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "CANCELLED":
      return "destructive";
    case "COMPLETED":
      return "secondary";
    case "ACTIVE":
      return "default";
    default:
      return "outline";
  }
}

export function PrescriptionList({
  prescriptions,
  canCreate,
  filters,
  title = "Prescriptions",
  description = "Medication orders for clinic patients.",
}: PrescriptionListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {canCreate ? (
          <Link href="/prescriptions/new" className={cn(buttonVariants())}>
            New prescription
          </Link>
        ) : null}
      </div>

      <form
        className="flex max-w-md flex-wrap items-end gap-2"
        action="/prescriptions"
        method="get"
      >
        <div className="min-w-48 flex-1 space-y-1">
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
            {PRESCRIPTION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {PRESCRIPTION_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Filter
        </button>
      </form>

      {prescriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No prescriptions found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Create a draft Rx and issue it when ready."
              : "Nothing matches these filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell>
                    <Link
                      href={`/prescriptions/${rx.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {rx.patientProfile.user.name}
                    </Link>
                    {rx.appointment ? (
                      <p className="text-xs text-muted-foreground">
                        Visit{" "}
                        {rx.appointment.startAt.toISOString().slice(0, 10)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{rx.doctorProfile.user.name}</TableCell>
                  <TableCell>{rx._count.items}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rx.status)}>
                      {PRESCRIPTION_STATUS_LABEL[rx.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rx.issuedAt
                      ? rx.issuedAt.toISOString().slice(0, 10)
                      : "—"}
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
