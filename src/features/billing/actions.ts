"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import {
  EDITABLE_STATUSES,
  PAYABLE_STATUSES,
  STATUS_TRANSITIONS,
} from "@/features/billing/constants";
import { toDecimal } from "@/features/billing/money";
import {
  amountPaidFromPayments,
  nextInvoiceNumber,
} from "@/features/billing/queries";
import {
  invoiceFormSchema,
  recordPaymentSchema,
  updateInvoiceStatusSchema,
} from "@/features/billing/schemas";
import { NOTIFICATION_EVENT } from "@/features/notifications/constants";
import { notifyUser } from "@/features/notifications/notify";
import { requireTenantContext } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type ActionResult =
  | { ok: true; invoiceId?: string }
  | { ok: false; error: string };

type InvoiceAccess =
  | {
      ok: true;
      session: Awaited<ReturnType<typeof requireTenantContext>>["session"];
      membership: Awaited<ReturnType<typeof requireTenantContext>>["membership"];
      tenantId: string;
      invoice: {
        id: string;
        invoiceNumber: string;
        status: "DRAFT" | "PENDING" | "PAID" | "VOID" | "OVERDUE";
        patientProfileId: string;
        appointmentId: string | null;
        total: Prisma.Decimal;
        patientUserId: string;
      };
    }
  | { ok: false; error: string };

async function assertStaffBillingAccess() {
  return requireTenantContext(["ADMIN", "RECEPTIONIST"]);
}

async function assertCanManageInvoice(
  invoiceId: string,
): Promise<InvoiceAccess> {
  const { session, membership, tenantId } = await assertStaffBillingAccess();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      patientProfileId: true,
      appointmentId: true,
      total: true,
      patientProfile: { select: { userId: true } },
    },
  });

  if (!invoice) {
    return { ok: false, error: "Invoice not found" };
  }

  return {
    ok: true,
    session,
    membership,
    tenantId,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      patientProfileId: invoice.patientProfileId,
      appointmentId: invoice.appointmentId,
      total: invoice.total,
      patientUserId: invoice.patientProfile.userId,
    },
  };
}

async function resolveLinkedAppointment(input: {
  tenantId: string;
  patientProfileId: string;
  appointmentId?: string;
  currentInvoiceId?: string;
}) {
  if (!input.appointmentId) {
    return { ok: true as const, appointmentId: null as string | null };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      tenantId: input.tenantId,
      patientProfileId: input.patientProfileId,
    },
    include: {
      invoice: { select: { id: true } },
    },
  });

  if (!appointment) {
    return {
      ok: false as const,
      error: "Appointment not found for this patient",
    };
  }

  if (
    appointment.invoice &&
    appointment.invoice.id !== input.currentInvoiceId
  ) {
    return {
      ok: false as const,
      error: "That appointment already has an invoice",
    };
  }

  return { ok: true as const, appointmentId: appointment.id };
}

function computeTotals(subtotal: string, tax?: string) {
  const sub = toDecimal(subtotal);
  const taxAmount = tax && tax !== "" ? toDecimal(tax) : toDecimal(0);
  return {
    subtotal: sub,
    tax: taxAmount,
    total: sub.add(taxAmount),
  };
}

function revalidateInvoicePaths(invoiceId: string, appointmentId?: string | null) {
  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  if (appointmentId) {
    revalidatePath(`/appointments/${appointmentId}`);
  }
}

export async function createInvoiceAction(
  input: unknown,
): Promise<ActionResult> {
  const { session, tenantId } = await assertStaffBillingAccess();
  const parsed = invoiceFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const patient = await prisma.patientProfile.findFirst({
    where: { id: parsed.data.patientProfileId, tenantId },
  });

  if (!patient) {
    return { ok: false, error: "Patient not found" };
  }

  const linked = await resolveLinkedAppointment({
    tenantId,
    patientProfileId: patient.id,
    appointmentId: parsed.data.appointmentId || undefined,
  });

  if (!linked.ok) {
    return { ok: false, error: linked.error };
  }

  const totals = computeTotals(parsed.data.subtotal, parsed.data.tax);
  const invoiceNumber = await nextInvoiceNumber(tenantId);

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      patientProfileId: patient.id,
      appointmentId: linked.appointmentId,
      createdById: session.user.id,
      invoiceNumber,
      status: "DRAFT",
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: (parsed.data.currency || "USD").toUpperCase(),
      dueAt: parsed.data.dueAt
        ? new Date(`${parsed.data.dueAt}T23:59:59.999Z`)
        : null,
      notes: parsed.data.notes || null,
    },
  });

  revalidateInvoicePaths(invoice.id, linked.appointmentId);
  return { ok: true, invoiceId: invoice.id };
}

export async function updateInvoiceAction(
  invoiceId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManageInvoice(invoiceId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  if (!EDITABLE_STATUSES.includes(access.invoice.status)) {
    return { ok: false, error: "Only draft invoices can be edited" };
  }

  const parsed = invoiceFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.patientProfileId !== access.invoice.patientProfileId) {
    return { ok: false, error: "Patient cannot be changed on an existing invoice" };
  }

  const linked = await resolveLinkedAppointment({
    tenantId: access.tenantId,
    patientProfileId: access.invoice.patientProfileId,
    appointmentId: parsed.data.appointmentId || undefined,
    currentInvoiceId: invoiceId,
  });

  if (!linked.ok) {
    return { ok: false, error: linked.error };
  }

  const totals = computeTotals(parsed.data.subtotal, parsed.data.tax);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      appointmentId: linked.appointmentId,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: (parsed.data.currency || "USD").toUpperCase(),
      dueAt: parsed.data.dueAt
        ? new Date(`${parsed.data.dueAt}T23:59:59.999Z`)
        : null,
      notes: parsed.data.notes || null,
    },
  });

  revalidateInvoicePaths(invoiceId, linked.appointmentId ?? access.invoice.appointmentId);
  return { ok: true, invoiceId };
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManageInvoice(invoiceId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const parsed = updateInvoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const nextStatus = parsed.data.status;
  const allowed = STATUS_TRANSITIONS[access.invoice.status];

  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot move from ${access.invoice.status} to ${nextStatus}`,
    };
  }

  if (nextStatus === "PENDING" && access.invoice.total.lte(0)) {
    return { ok: false, error: "Invoice total must be greater than zero" };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: nextStatus },
  });

  if (nextStatus === "PENDING") {
    await notifyUser({
      tenantId: access.tenantId,
      userId: access.invoice.patientUserId,
      event: NOTIFICATION_EVENT.INVOICE_ISSUED,
      title: "Invoice issued",
      body: `${access.invoice.invoiceNumber} is ready for payment.`,
      href: `/billing/${invoiceId}`,
    });
  }

  revalidateInvoicePaths(invoiceId, access.invoice.appointmentId);
  revalidatePath("/notifications");
  return { ok: true, invoiceId };
}

export async function recordPaymentAction(
  invoiceId: string,
  input: unknown,
): Promise<ActionResult> {
  const access = await assertCanManageInvoice(invoiceId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  if (!PAYABLE_STATUSES.includes(access.invoice.status)) {
    return {
      ok: false,
      error: "Payments can only be recorded on pending or overdue invoices",
    };
  }

  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const amount = toDecimal(parsed.data.amount);
  const existingPayments = await prisma.payment.findMany({
    where: { invoiceId },
    select: { amount: true },
  });
  const alreadyPaid = amountPaidFromPayments(existingPayments);
  const remaining = access.invoice.total.sub(alreadyPaid);

  if (amount.gt(remaining)) {
    return {
      ok: false,
      error: `Payment exceeds remaining balance (${remaining.toFixed(2)})`,
    };
  }

  const paidAt = parsed.data.paidAt
    ? new Date(`${parsed.data.paidAt}T12:00:00.000Z`)
    : new Date();

  const newPaid = alreadyPaid.add(amount);
  const fullyPaid = newPaid.gte(access.invoice.total);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method: parsed.data.method,
        reference: parsed.data.reference || null,
        paidAt,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: fullyPaid
        ? { status: "PAID", paidAt }
        : {},
    }),
  ]);

  if (fullyPaid) {
    await notifyUser({
      tenantId: access.tenantId,
      userId: access.invoice.patientUserId,
      event: NOTIFICATION_EVENT.INVOICE_PAID,
      title: "Invoice paid",
      body: `${access.invoice.invoiceNumber} is marked paid. Thank you.`,
      href: `/billing/${invoiceId}`,
    });
  }

  revalidateInvoicePaths(invoiceId, access.invoice.appointmentId);
  revalidatePath("/notifications");
  return { ok: true, invoiceId };
}
