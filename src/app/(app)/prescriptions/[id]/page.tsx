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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrescriptionStatusActions } from "@/features/prescriptions/components/prescription-status-actions";
import { PRESCRIPTION_STATUS_LABEL } from "@/features/prescriptions/constants";
import { getPrescriptionById } from "@/features/prescriptions/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type PrescriptionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PrescriptionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Prescription · ${id.slice(0, 6)}` };
}

export default async function PrescriptionDetailPage({
  params,
}: PrescriptionDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const prescription = await getPrescriptionById(tenantId, id);

  if (!prescription) {
    notFound();
  }

  if (
    membership.role === "DOCTOR" &&
    prescription.doctorProfile.user.id !== session.user.id
  ) {
    redirect("/prescriptions");
  }

  if (
    membership.role === "PATIENT" &&
    prescription.patientProfile.user.id !== session.user.id
  ) {
    redirect("/prescriptions");
  }

  const canManage =
    membership.role === "DOCTOR" &&
    prescription.doctorProfile.user.id === session.user.id;
  const canEditDraft = canManage && prescription.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/prescriptions"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Prescriptions
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {prescription.patientProfile.user.name}
            </h1>
            <Badge variant="outline">
              {PRESCRIPTION_STATUS_LABEL[prescription.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Prescribed by {prescription.doctorProfile.user.name}
            {prescription.issuedAt
              ? ` · issued ${prescription.issuedAt.toISOString().slice(0, 10)}`
              : ""}
          </p>
        </div>
        {canEditDraft ? (
          <Link
            href={`/prescriptions/${prescription.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit draft
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
            <CardDescription>Patient and visit linkage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Patient:</span>{" "}
              <Link
                href={`/patients/${prescription.patientProfile.id}`}
                className="font-medium hover:underline"
              >
                {prescription.patientProfile.user.name}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Doctor:</span>{" "}
              <Link
                href={`/doctors/${prescription.doctorProfile.id}`}
                className="font-medium hover:underline"
              >
                {prescription.doctorProfile.user.name}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Appointment:</span>{" "}
              {prescription.appointment ? (
                <Link
                  href={`/appointments/${prescription.appointment.id}`}
                  className="font-medium hover:underline"
                >
                  {prescription.appointment.startAt.toISOString().slice(0, 10)}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Notes:</span>{" "}
              {prescription.notes || "—"}
            </p>
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Issue the draft, then complete or cancel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrescriptionStatusActions
                prescriptionId={prescription.id}
                status={prescription.status}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Read-only for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {PRESCRIPTION_STATUS_LABEL[prescription.status]}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
          <CardDescription>
            {prescription.items.length} line item
            {prescription.items.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prescription.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.medicationName}</p>
                        {item.instructions ? (
                          <p className="text-xs text-muted-foreground">
                            {item.instructions}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell>{item.frequency}</TableCell>
                      <TableCell>{item.duration || "—"}</TableCell>
                      <TableCell>{item.quantity ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
