import { z } from "zod";

export const draftEncounterSchema = z.object({
  appointmentId: z.string().min(1),
  chiefComplaint: z.string().trim().max(500).optional().or(z.literal("")),
});

export const suggestPrescriptionSchema = z.object({
  patientProfileId: z.string().min(1),
  clinicalHint: z.string().trim().min(3, "Enter a short clinical hint").max(500),
});

export type DraftEncounterInput = z.infer<typeof draftEncounterSchema>;
export type SuggestPrescriptionInput = z.infer<typeof suggestPrescriptionSchema>;
