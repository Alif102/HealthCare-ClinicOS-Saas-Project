import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { InvoiceStatus } from "@prisma/client";

import { InvoiceList } from "@/features/billing/components/invoice-list";
import { INVOICE_STATUS_OPTIONS } from "@/features/billing/constants";
import { listInvoices } from "@/features/billing/queries";
import { getPatientByUserId } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Billing",
};

type BillingPageProps = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value?: string): InvoiceStatus | undefined {
  if (!value) return undefined;
  return INVOICE_STATUS_OPTIONS.includes(
    value as (typeof INVOICE_STATUS_OPTIONS)[number],
  )
    ? (value as InvoiceStatus)
    : undefined;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "PATIENT",
  ]);
  const status = parseStatus(params.status);

  let patientProfileId: string | undefined;
  let title = "Billing";
  let description = "Clinic invoices and recorded payments.";
  const canCreate =
    membership.role === "ADMIN" || membership.role === "RECEPTIONIST";

  if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/patients/me");
    }
    patientProfileId = me.id;
    title = "My invoices";
    description = "Charges and payment history for your visits.";
  }

  const invoices = await listInvoices(tenantId, {
    status,
    patientProfileId,
  });

  return (
    <InvoiceList
      invoices={invoices}
      canCreate={canCreate}
      filters={{ status }}
      title={title}
      description={description}
    />
  );
}
