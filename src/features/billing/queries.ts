import type { InvoiceStatus } from "@prisma/client";

import { nextInvoiceSequence } from "@/features/billing/invoice-number";
import { clampTake } from "@/lib/pagination";
import { prisma } from "@/lib/db";

const invoiceInclude = {
  patientProfile: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  appointment: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      doctorProfile: {
        select: {
          id: true,
          specialty: true,
          consultationFee: true,
          user: { select: { name: true } },
        },
      },
    },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  payments: {
    orderBy: { paidAt: "desc" as const },
  },
} as const;

export type InvoiceListFilters = {
  status?: InvoiceStatus;
  patientProfileId?: string;
  take?: number;
};

export async function listInvoices(
  tenantId: string,
  filters: InvoiceListFilters = {},
) {
  const take = clampTake(filters.take);

  return prisma.invoice.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.patientProfileId
        ? { patientProfileId: filters.patientProfileId }
        : {}),
    },
    include: {
      patientProfile: invoiceInclude.patientProfile,
      appointment: {
        select: {
          id: true,
          startAt: true,
        },
      },
      _count: { select: { payments: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
  });
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: invoiceInclude,
  });
}

export async function listBillableAppointments(input: {
  tenantId: string;
  patientProfileId?: string;
}) {
  return prisma.appointment.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.patientProfileId
        ? { patientProfileId: input.patientProfileId }
        : {}),
      invoice: null,
      status: {
        in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"],
      },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      patientProfileId: true,
      patientProfile: {
        select: { user: { select: { name: true } } },
      },
      doctorProfile: {
        select: {
          consultationFee: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: [{ startAt: "desc" }],
    take: 40,
  });
}

export async function nextInvoiceNumber(tenantId: string) {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;

  const latest = await prisma.invoice.findFirst({
    where: {
      tenantId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  return nextInvoiceSequence(year, latest?.invoiceNumber);
}
