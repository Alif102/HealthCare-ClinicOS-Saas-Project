import type { InvoiceStatus, PaymentMethod } from "@prisma/client";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PAID: "Paid",
  VOID: "Void",
  OVERDUE: "Overdue",
};

export const INVOICE_STATUS_OPTIONS = [
  "DRAFT",
  "PENDING",
  "PAID",
  "VOID",
  "OVERDUE",
] as const satisfies readonly InvoiceStatus[];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

export const PAYMENT_METHOD_OPTIONS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "INSURANCE",
  "OTHER",
] as const satisfies readonly PaymentMethod[];

/**
 * Staff-driven status transitions (payments set PAID separately).
 * DRAFT → PENDING = issue invoice
 */
export const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["PENDING", "VOID"],
  PENDING: ["OVERDUE", "VOID"],
  OVERDUE: ["VOID"],
  PAID: [],
  VOID: [],
};

export const EDITABLE_STATUSES: InvoiceStatus[] = ["DRAFT"];

export const PAYABLE_STATUSES: InvoiceStatus[] = ["PENDING", "OVERDUE"];
