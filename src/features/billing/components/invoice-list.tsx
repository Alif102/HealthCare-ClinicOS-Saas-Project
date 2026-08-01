import Link from "next/link";
import type { InvoiceStatus, Prisma } from "@prisma/client";

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
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_OPTIONS,
} from "@/features/billing/constants";
import { formatMoney } from "@/features/billing/money";
import { cn } from "@/lib/utils";

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: Prisma.Decimal;
  currency: string;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  _count: { payments: number };
  patientProfile: {
    user: { name: string };
  };
  appointment: {
    id: string;
    startAt: Date;
  } | null;
};

type InvoiceListProps = {
  invoices: InvoiceListItem[];
  canCreate: boolean;
  filters: { status?: string };
  title?: string;
  description?: string;
};

function statusVariant(
  status: InvoiceStatus,
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

export function InvoiceList({
  invoices,
  canCreate,
  filters,
  title = "Billing",
  description = "Clinic invoices and payments.",
}: InvoiceListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {canCreate ? (
          <Link href="/billing/new" className={cn(buttonVariants())}>
            New invoice
          </Link>
        ) : null}
      </div>

      <form
        className="flex max-w-md flex-wrap items-end gap-2"
        action="/billing"
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
            {INVOICE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {INVOICE_STATUS_LABEL[status]}
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

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No invoices found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Create a draft invoice and issue it when ready."
              : "Nothing matches these filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/billing/${invoice.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    {invoice.appointment ? (
                      <p className="text-xs text-muted-foreground">
                        Visit{" "}
                        {invoice.appointment.startAt.toISOString().slice(0, 10)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{invoice.patientProfile.user.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatMoney(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invoice.status)}>
                      {INVOICE_STATUS_LABEL[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.paidAt
                      ? `Paid ${invoice.paidAt.toISOString().slice(0, 10)}`
                      : invoice.dueAt
                        ? invoice.dueAt.toISOString().slice(0, 10)
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
