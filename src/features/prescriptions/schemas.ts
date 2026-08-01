import { z } from "zod";

import { PRESCRIPTION_STATUS_OPTIONS } from "@/features/prescriptions/constants";

export const prescriptionItemSchema = z.object({
  medicationName: z.string().trim().min(1, "Medication is required").max(120),
  dosage: z.string().trim().min(1, "Dosage is required").max(80),
  frequency: z.string().trim().min(1, "Frequency is required").max(80),
  duration: z.string().trim().max(80).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  quantity: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        value === undefined ||
        value === "" ||
        (/^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 9999),
      "Enter a whole number quantity",
    ),
});

export const prescriptionFormSchema = z.object({
  patientProfileId: z.string().min(1, "Select a patient"),
  appointmentId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z
    .array(prescriptionItemSchema)
    .min(1, "Add at least one medication"),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum(PRESCRIPTION_STATUS_OPTIONS),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionFormInput = z.infer<typeof prescriptionFormSchema>;
export type UpdatePrescriptionStatusInput = z.infer<
  typeof updatePrescriptionStatusSchema
>;
