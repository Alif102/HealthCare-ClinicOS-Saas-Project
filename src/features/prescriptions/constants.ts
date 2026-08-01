import type { PrescriptionStatus } from "@prisma/client";

export const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PRESCRIPTION_STATUS_OPTIONS = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly PrescriptionStatus[];

export const STATUS_TRANSITIONS: Record<
  PrescriptionStatus,
  PrescriptionStatus[]
> = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
