import type { AiProviderId } from "@/features/ai/constants";

export type ClinicalContext = {
  chiefComplaint: string;
  allergies: string[];
  conditions: string[];
};

export type EncounterDraft = {
  assessment: string;
  plan: string;
  provider: AiProviderId;
};

export type PrescriptionSuggestion = {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type PrescriptionDraft = {
  items: PrescriptionSuggestion[];
  notes: string;
  provider: AiProviderId;
};

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function activeAiProvider(): AiProviderId {
  return isOpenAiConfigured() ? "openai" : "local";
}
