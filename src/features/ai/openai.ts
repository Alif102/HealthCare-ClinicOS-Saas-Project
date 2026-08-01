import { AI_PROVIDERS } from "@/features/ai/constants";
import type {
  ClinicalContext,
  EncounterDraft,
  PrescriptionDraft,
  PrescriptionSuggestion,
} from "@/features/ai/types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function chatJson<T>(messages: ChatMessage[]): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(content) as T;
}

function contextBlock(ctx: ClinicalContext) {
  return [
    `Chief complaint: ${ctx.chiefComplaint || "(not provided)"}`,
    `Allergies (labels only): ${ctx.allergies.join(", ") || "none listed"}`,
    `Conditions (labels only): ${ctx.conditions.join(", ") || "none listed"}`,
  ].join("\n");
}

export async function draftEncounterOpenAi(
  ctx: ClinicalContext,
): Promise<EncounterDraft> {
  const parsed = await chatJson<{ assessment?: string; plan?: string }>([
    {
      role: "system",
      content:
        "You assist a licensed clinician drafting encounter notes. Return JSON with keys assessment and plan. Be concise, cautious, and never claim certainty. Do not invent vitals or lab results. No patient identifiers.",
    },
    {
      role: "user",
      content: `Draft assessment and plan from this de-identified context:\n${contextBlock(ctx)}`,
    },
  ]);

  return {
    assessment: parsed.assessment?.trim() || "Unable to draft assessment.",
    plan: parsed.plan?.trim() || "Unable to draft plan.",
    provider: AI_PROVIDERS.OPENAI,
  };
}

export async function suggestPrescriptionOpenAi(
  ctx: ClinicalContext,
): Promise<PrescriptionDraft> {
  const parsed = await chatJson<{
    notes?: string;
    items?: PrescriptionSuggestion[];
  }>([
    {
      role: "system",
      content:
        "You assist a licensed clinician with draft OTC/common Rx ideas. Return JSON { notes: string, items: [{ medicationName, dosage, frequency, duration, instructions }] }. Prefer conservative options. Respect allergies. Never invent controlled substances. Max 3 items. Not medical advice.",
    },
    {
      role: "user",
      content: `Suggest draft prescription lines from this de-identified context:\n${contextBlock(ctx)}`,
    },
  ]);

  const items = Array.isArray(parsed.items)
    ? parsed.items
        .slice(0, 3)
        .map((item) => ({
          medicationName: String(item.medicationName ?? "").trim(),
          dosage: String(item.dosage ?? "").trim(),
          frequency: String(item.frequency ?? "").trim(),
          duration: String(item.duration ?? "").trim(),
          instructions: String(item.instructions ?? "").trim(),
        }))
        .filter((item) => item.medicationName)
    : [];

  return {
    items,
    notes: parsed.notes?.trim() || "Draft suggestions — review before issuing.",
    provider: AI_PROVIDERS.OPENAI,
  };
}
