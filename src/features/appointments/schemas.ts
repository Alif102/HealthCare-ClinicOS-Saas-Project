import { z } from "zod";

import {
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
} from "@/features/appointments/constants";

export const bookAppointmentSchema = z.object({
  doctorProfileId: z.string().min(1, "Select a doctor"),
  patientProfileId: z.string().min(1, "Select a patient"),
  /** ISO datetime for slot start (UTC). */
  startAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid start time"),
  type: z.enum(APPOINTMENT_TYPE_OPTIONS),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS_OPTIONS),
  cancellationReason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const availableSlotsQuerySchema = z.object({
  doctorProfileId: z.string().min(1),
  /** YYYY-MM-DD in clinic calendar (UTC for demo). */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
