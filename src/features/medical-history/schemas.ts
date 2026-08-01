import { z } from "zod";

import {
  ALLERGY_SEVERITY_OPTIONS,
  CONDITION_STATUS_OPTIONS,
} from "@/features/medical-history/constants";

export const allergySchema = z.object({
  allergen: z.string().trim().min(1, "Allergen is required").max(120),
  reaction: z.string().trim().max(200).optional().or(z.literal("")),
  severity: z.enum(ALLERGY_SEVERITY_OPTIONS),
  notedAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Enter a valid date",
    ),
});

export const conditionSchema = z.object({
  name: z.string().trim().min(1, "Condition name is required").max(160),
  status: z.enum(CONDITION_STATUS_OPTIONS),
  diagnosedAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Enter a valid date",
    ),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const encounterSchema = z.object({
  chiefComplaint: z.string().trim().max(500).optional().or(z.literal("")),
  assessment: z.string().trim().max(4000).optional().or(z.literal("")),
  plan: z.string().trim().max(4000).optional().or(z.literal("")),
  bloodPressure: z.string().trim().max(40).optional().or(z.literal("")),
  heartRate: z.string().trim().max(20).optional().or(z.literal("")),
  temperature: z.string().trim().max(20).optional().or(z.literal("")),
  weight: z.string().trim().max(20).optional().or(z.literal("")),
});

export type AllergyInput = z.infer<typeof allergySchema>;
export type ConditionInput = z.infer<typeof conditionSchema>;
export type EncounterInput = z.infer<typeof encounterSchema>;
