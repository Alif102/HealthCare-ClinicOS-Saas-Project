import { prisma } from "@/lib/db";
import {
  isAiAssistEnabled,
  parseTenantSettings,
} from "@/features/admin/settings";

export async function getTenantForAdmin(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
  });
}

export async function getClinicOverview(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const [
    doctors,
    patients,
    activeStaff,
    appointmentsToday,
    pendingInvoices,
    unreadNotifications,
    tenant,
  ] = await Promise.all([
    prisma.doctorProfile.count({ where: { tenantId } }),
    prisma.patientProfile.count({ where: { tenantId } }),
    prisma.tenantMembership.count({
      where: {
        tenantId,
        status: "ACTIVE",
        role: { in: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        startAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    prisma.invoice.count({
      where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } },
    }),
    prisma.notification.count({
      where: { tenantId, channel: "IN_APP", isRead: false },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true, isActive: true, settings: true },
    }),
  ]);

  return {
    doctors,
    patients,
    activeStaff,
    appointmentsToday,
    pendingInvoices,
    unreadNotifications,
    clinicName: tenant?.name ?? "Clinic",
    clinicSlug: tenant?.slug ?? "",
    clinicActive: tenant?.isActive ?? true,
    aiAssistEnabled: isAiAssistEnabled(tenant?.settings),
  };
}

export async function listMemberships(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function getRecentClinicActivity(tenantId: string) {
  const [appointments, invoices, memberships] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        type: true,
        startAt: true,
        updatedAt: true,
        patientProfile: {
          select: { user: { select: { name: true } } },
        },
        doctorProfile: {
          select: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        currency: true,
        updatedAt: true,
        patientProfile: {
          select: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.tenantMembership.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        status: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { appointments, invoices, memberships };
}

export async function assertAiAssistAllowed(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return isAiAssistEnabled(tenant?.settings);
}

export { parseTenantSettings, isAiAssistEnabled };
