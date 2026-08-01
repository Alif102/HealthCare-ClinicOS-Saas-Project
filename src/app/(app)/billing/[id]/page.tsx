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
import { InvoiceStatusActions } from "@/features/billing/components/invoice-status-actions";
import { RecordPaymentForm } from "@/features/billing/components/record-payment-form";
import {
  INVOICE_STATUS_LABEL,
  PAYABLE_STATUSES,
  PAYMENT_METHOD_LABEL,
} from "@/features/billing/constants";
import { getInvoiceById } from "@/features/billing/queries";
import {
  amountPaidFromPayments,
  decimalToInput,
  formatMoney,
} from "@/features/billing/money";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: InvoiceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice · ${id.slice(0, 6)}` };
}

function statusVariant(
  status: "DRAFT" | "PENDING" | "PAID" | "VOID" | "OVERDUE",
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "VOID":
    case "OVERDUE":
      return "destructive";
    case "PAID":
      return "secondary";
    case "PENDING":
      return "default";
    default:
      return "outline";
  }
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext([
    "ADMIN",
    "RECEPTIONIST",
    "PATIENT",
  ]);
  const invoice = await getInvoiceById(tenantId, id);

  if (!invoice) {
    notFound();
  }

  if (
    membership.role === "PATIENT" &&
    invoice.patientProfile.user.id !== session.user.id
  ) {
    redirect("/billing");
  }

  const canManage =
    membership.role === "ADMIN" || membership.role === "RECEPTIONIST";
  const canEditDraft = canManage && invoice.status === "DRAFT";
  const canRecordPayment =
    canManage && PAYABLE_STATUSES.includes(invoice.status);

  const paid = amountPaidFromPayments(invoice.payments);
  const remaining = invoice.total.sub(paid);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/billing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Billing
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant={statusVariant(invoice.status)}>
              {INVOICE_STATUS_LABEL[invoice.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.patientProfile.user.name}
            {invoice.createdBy
              ? ` · created by ${invoice.createdBy.name}`
              : ""}
          </p>
        </div>
        {canEditDraft ? (
          <Link
            href={`/billing/${invoice.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit draft
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amounts</CardTitle>
            <CardDescription>Subtotal, tax, and balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {formatMoney(invoice.subtotal, invoice.currency)}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">
                {formatMoney(invoice.tax, invoice.currency)}
              </span>
            </p>
            <p className="flex justify-between gap-4 border-t border-border/60 pt-2 font-medium">
              <span>Total</span>
              <span className="tabular-nums">
                {formatMoney(invoice.total, invoice.currency)}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Paid</span>
              <span className="tabular-nums">
                {formatMoney(paid, invoice.currency)}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Remaining</span>
              <span className="tabular-nums">
                {formatMoney(remaining, invoice.currency)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Due:</span>{" "}
              {invoice.dueAt
                ? invoice.dueAt.toISOString().slice(0, 10)
                : "—"}
            </p>
            {invoice.paidAt ? (
              <p>
                <span className="text-muted-foreground">Paid on:</span>{" "}
                {invoice.paidAt.toISOString().slice(0, 10)}
              </p>
            ) : null}
            {invoice.notes ? (
              <p>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {invoice.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit</CardTitle>
            <CardDescription>Linked appointment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {invoice.appointment ? (
              <>
                <p>
                  <span className="text-muted-foreground">When:</span>{" "}
                  {invoice.appointment.startAt.toISOString().slice(0, 10)} ·{" "}
                  {invoice.appointment.startAt.toISOString().slice(11, 16)} UTC
                </p>
                <p>
                  <span className="text-muted-foreground">Doctor:</span>{" "}
                  {invoice.appointment.doctorProfile.user.name} ·{" "}
                  {invoice.appointment.doctorProfile.specialty}
                </p>
                <Link
                  href={`/appointments/${invoice.appointment.id}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Open appointment
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">
                No appointment linked to this invoice.
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Patient:</span>{" "}
              <Link
                href={`/patients/${invoice.patientProfileId}`}
                className="font-medium hover:underline"
              >
                {invoice.patientProfile.user.name}
              </Link>
            </p>
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
              <CardDescription>
                Issue, mark overdue, or void this invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceStatusActions
                invoiceId={invoice.id}
                status={invoice.status}
              />
            </CardContent>
          </Card>
        ) : null}

        {canRecordPayment ? (
          <Card>
            <CardHeader>
              <CardTitle>Record payment</CardTitle>
              <CardDescription>
                Manual payment entry (no card gateway in this phase)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecordPaymentForm
                invoiceId={invoice.id}
                remainingBalance={decimalToInput(remaining)}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className={canManage ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
            <CardDescription>
              {invoice.payments.length} payment
              {invoice.payments.length === 1 ? "" : "s"} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.paidAt.toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        {PAYMENT_METHOD_LABEL[payment.method]}
                      </TableCell>
                      <TableCell>{payment.reference || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(payment.amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
