import Link from "next/link";

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
import { GENDER_LABEL } from "@/features/patients/constants";
import { cn } from "@/lib/utils";
import type { Gender } from "@prisma/client";

type PatientListItem = {
  id: string;
  phone: string | null;
  gender: Gender;
  dateOfBirth: Date | null;
  user: {
    name: string;
    email: string;
  };
};

type PatientListProps = {
  patients: PatientListItem[];
  canCreate: boolean;
  search?: string;
};

function formatDob(value: Date | null) {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

export function PatientList({ patients, canCreate, search }: PatientListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demographics and contact records for the clinic.
          </p>
        </div>
        {canCreate ? (
          <Link href="/patients/new" className={cn(buttonVariants())}>
            Register patient
          </Link>
        ) : null}
      </div>

      <form className="flex max-w-md gap-2" action="/patients" method="get">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Search name, email, or phone"
          aria-label="Search patients"
        />
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
          Search
        </button>
      </form>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No patients found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Register the first patient for this clinic."
              : "No matching patient records."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Gender</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Link
                      href={`/patients/${patient.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {patient.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {patient.user.email}
                    </p>
                  </TableCell>
                  <TableCell>{patient.phone || "—"}</TableCell>
                  <TableCell>{formatDob(patient.dateOfBirth)}</TableCell>
                  <TableCell>{GENDER_LABEL[patient.gender]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
