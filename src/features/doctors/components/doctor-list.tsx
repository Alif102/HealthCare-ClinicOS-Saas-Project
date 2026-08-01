import Link from "next/link";

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
import { cn } from "@/lib/utils";

type DoctorListItem = {
  id: string;
  specialty: string;
  isAcceptingPatients: boolean;
  consultationFee: { toString(): string } | null;
  user: {
    name: string;
    email: string;
  };
  _count: {
    availabilities: number;
  };
};

type DoctorListProps = {
  doctors: DoctorListItem[];
  canCreate: boolean;
};

export function DoctorList({ doctors, canCreate }: DoctorListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Doctors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinic clinicians, specialties, and weekly availability.
          </p>
        </div>
        {canCreate ? (
          <Link href="/doctors/new" className={cn(buttonVariants())}>
            Add doctor
          </Link>
        ) : null}
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No doctors yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Create the first clinician profile for this clinic."
              : "Ask an admin to add doctors to the clinic."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {doctor.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {doctor.user.email}
                    </p>
                  </TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell>
                    {doctor.consultationFee
                      ? `$${doctor.consultationFee.toString()}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {doctor._count.availabilities} slot
                    {doctor._count.availabilities === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={doctor.isAcceptingPatients ? "default" : "secondary"}>
                      {doctor.isAcceptingPatients ? "Accepting" : "Paused"}
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
