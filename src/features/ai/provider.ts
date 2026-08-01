import {
  draftEncounterLocal,
  suggestPrescriptionLocal,
} from "@/features/ai/local";
import {
  draftEncounterOpenAi,
  suggestPrescriptionOpenAi,
} from "@/features/ai/openai";
import {
  activeAiProvider,
  isOpenAiConfigured,
  type ClinicalContext,
  type EncounterDraft,
  type PrescriptionDraft,
} from "@/features/ai/types";

/**
 * Provider facade — OpenAI when keyed, otherwise local templates.
 * Mirrors the optional Resend / Jitsi pattern for ThemeForest demos.
 */
export async function generateEncounterDraft(
  ctx: ClinicalContext,
): Promise<EncounterDraft> {
  if (isOpenAiConfigured()) {
    try {
      return await draftEncounterOpenAi(ctx);
    } catch (error) {
      console.error("[ai] OpenAI encounter draft failed, using local", error);
      return draftEncounterLocal(ctx);
    }
  }
  return draftEncounterLocal(ctx);
}

export async function generatePrescriptionDraft(
  ctx: ClinicalContext,
): Promise<PrescriptionDraft> {
  if (isOpenAiConfigured()) {
    try {
      return await suggestPrescriptionOpenAi(ctx);
    } catch (error) {
      console.error("[ai] OpenAI Rx draft failed, using local", error);
      return suggestPrescriptionLocal(ctx);
    }
  }
  return suggestPrescriptionLocal(ctx);
}

export { activeAiProvider, isOpenAiConfigured };
