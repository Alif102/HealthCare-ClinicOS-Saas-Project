import type { AppointmentStatus, AppointmentType } from "@prisma/client";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  IN_PERSON: "In person",
  VIDEO: "Video",
  FOLLOW_UP: "Follow-up",
};

export const APPOINTMENT_TYPE_OPTIONS = [
  "IN_PERSON",
  "VIDEO",
  "FOLLOW_UP",
] as const satisfies readonly AppointmentType[];

export const APPOINTMENT_STATUS_OPTIONS = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const satisfies readonly AppointmentStatus[];

/** Statuses that still occupy a calendar slot. */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
];

/**
 * Allowed forward transitions for clinic staff.
 * Patients are limited separately (cancel only).
 */
export const STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  SCHEDULED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const PATIENT_CANCELLABLE: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
];
