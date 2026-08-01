import type { Metadata } from "next";

import { InvoiceForm } from "@/features/billing/components/invoice-form";
import { decimalToInput } from "@/features/billing/money";
import { listBillableAppointments } from "@/features/billing/queries";
import { listPatients } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "New invoice",
};

type NewInvoicePageProps = {
  searchParams: Promise<{
    patientId?: string;
    appointmentId?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const params = await searchParams;
  const { tenantId } = await requireTenantContext(["ADMIN", "RECEPTIONIST"]);

  const [patients, appointments] = await Promise.all([
    listPatients(tenantId),
    listBillableAppointments({ tenantId }),
  ]);

  const suggested = appointments.find((row) => row.id === params.appointmentId);
  const defaultSubtotal = suggested?.doctorProfile.consultationFee
    ? decimalToInput(suggested.doctorProfile.consultationFee)
    : "75.00";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a draft charge for a patient visit. Issue it when ready to
          collect payment.
        </p>
      </div>

      <InvoiceForm
        mode="create"
        patients={patients.map((patient) => ({
          id: patient.id,
          user: patient.user,
        }))}
        appointments={appointments.map((appointment) => ({
          id: appointment.id,
          startAt: appointment.startAt,
          patientProfileId: appointment.patientProfileId,
          suggestedSubtotal: appointment.doctorProfile.consultationFee
            ? decimalToInput(appointment.doctorProfile.consultationFee)
            : undefined,
          label: `${appointment.startAt.toISOString().slice(0, 10)} · ${appointment.patientProfile.user.name} · ${appointment.doctorProfile.user.name}`,
        }))}
        defaultValues={{
          patientProfileId:
            params.patientId ||
            suggested?.patientProfileId ||
            patients[0]?.id ||
            "",
          appointmentId: params.appointmentId || "",
          subtotal: defaultSubtotal,
          tax: "0.00",
          currency: "USD",
        }}
        lockPatient={Boolean(params.patientId || params.appointmentId)}
      />
    </div>
  );
}
