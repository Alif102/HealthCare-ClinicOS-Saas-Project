import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InvoiceForm } from "@/features/billing/components/invoice-form";
import { decimalToInput } from "@/features/billing/money";
import {
  getInvoiceById,
  listBillableAppointments,
} from "@/features/billing/queries";
import { listPatients } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EditInvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit invoice · ${id.slice(0, 6)}` };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;
  const { tenantId } = await requireTenantContext(["ADMIN", "RECEPTIONIST"]);
  const invoice = await getInvoiceById(tenantId, id);

  if (!invoice) {
    notFound();
  }

  if (invoice.status !== "DRAFT") {
    redirect(`/billing/${invoice.id}`);
  }

  const [patients, appointments] = await Promise.all([
    listPatients(tenantId),
    listBillableAppointments({
      tenantId,
      patientProfileId: invoice.patientProfileId,
    }),
  ]);

  const appointmentOptions = [
    ...(invoice.appointment
      ? [
          {
            id: invoice.appointment.id,
            startAt: invoice.appointment.startAt,
            patientProfileId: invoice.patientProfileId,
            suggestedSubtotal: invoice.appointment.doctorProfile.consultationFee
              ? decimalToInput(
                  invoice.appointment.doctorProfile.consultationFee,
                )
              : undefined,
            label: `${invoice.appointment.startAt.toISOString().slice(0, 10)} · ${invoice.appointment.doctorProfile.user.name} (current)`,
          },
        ]
      : []),
    ...appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt,
      patientProfileId: appointment.patientProfileId,
      suggestedSubtotal: appointment.doctorProfile.consultationFee
        ? decimalToInput(appointment.doctorProfile.consultationFee)
        : undefined,
      label: `${appointment.startAt.toISOString().slice(0, 10)} · ${appointment.patientProfile.user.name} · ${appointment.doctorProfile.user.name}`,
    })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/billing/${invoice.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {invoice.invoiceNumber}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Edit draft invoice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust amounts and visit link before issuing.
        </p>
      </div>

      <InvoiceForm
        mode="edit"
        invoiceId={invoice.id}
        lockPatient
        patients={patients.map((patient) => ({
          id: patient.id,
          user: patient.user,
        }))}
        appointments={appointmentOptions}
        defaultValues={{
          patientProfileId: invoice.patientProfileId,
          appointmentId: invoice.appointmentId ?? "",
          subtotal: decimalToInput(invoice.subtotal),
          tax: decimalToInput(invoice.tax),
          currency: invoice.currency,
          dueAt: invoice.dueAt ? invoice.dueAt.toISOString().slice(0, 10) : "",
          notes: invoice.notes ?? "",
        }}
      />
    </div>
  );
}
