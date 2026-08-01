import type {
  ClinicalContext,
  EncounterDraft,
  PrescriptionDraft,
} from "@/features/ai/types";
import { AI_PROVIDERS } from "@/features/ai/constants";

function allergyLine(allergies: string[]) {
  if (allergies.length === 0) return "No documented allergies in chart.";
  return `Documented allergies: ${allergies.join(", ")}. Avoid related agents.`;
}

function conditionLine(conditions: string[]) {
  if (conditions.length === 0) return "No active conditions listed.";
  return `Known conditions: ${conditions.join(", ")}.`;
}

function matchRule(complaint: string) {
  const text = complaint.toLowerCase();

  if (/cough|cold|uri|upper respiratory|sore throat/.test(text)) {
    return {
      assessment:
        "Likely viral upper respiratory symptoms. Differential includes allergic rhinitis and early bacterial pharyngitis if fever/exudate develop. Asthma status reviewed if applicable.",
      plan: "Supportive care (fluids, rest, saline rinse). OTC analgesics as needed if no contraindications. Return precautions for dyspnea, high fever, or symptoms >7–10 days. Follow asthma action plan if relevant.",
      items: [
        {
          medicationName: "Acetaminophen",
          dosage: "500 mg",
          frequency: "Every 6 hours as needed",
          duration: "3–5 days",
          instructions: "Do not exceed 3 g/day; avoid other acetaminophen products.",
        },
        {
          medicationName: "Guaifenesin",
          dosage: "400 mg",
          frequency: "Every 4 hours as needed",
          duration: "5 days",
          instructions: "Take with water; stop if cough worsens or fever develops.",
        },
      ],
      notes: "Supportive URI care draft — adjust for allergies and comorbidities.",
    };
  }

  if (/headache|migraine/.test(text)) {
    return {
      assessment:
        "Primary headache syndrome most likely (tension-type vs migraine). Red flags screened (sudden onset, neuro deficits, fever/neck stiffness) — clinician must confirm.",
      plan: "Lifestyle triggers review, hydration, sleep hygiene. Analgesic trial if safe. Urgent workup if red flags present. Follow-up if recurrent or worsening.",
      items: [
        {
          medicationName: "Ibuprofen",
          dosage: "400 mg",
          frequency: "Every 6–8 hours as needed",
          duration: "3 days",
          instructions: "Take with food; avoid if NSAID allergy, PUD, or renal disease.",
        },
      ],
      notes: "Headache supportive draft — verify red flags before issuing.",
    };
  }

  if (/follow[- ]?up|check[- ]?up|routine|review/.test(text)) {
    return {
      assessment:
        "Routine follow-up / wellness review. Chronic conditions appear stable based on available chart labels; confirm symptoms and adherence in visit.",
      plan: "Continue current therapies if stable. Update preventive care. Patient education on warning signs. Schedule next review as clinically appropriate.",
      items: [],
      notes: "Routine visit — medication changes only if clinically indicated.",
    };
  }

  if (/rash|itch|dermat/.test(text)) {
    return {
      assessment:
        "Localized dermatitis / pruritic rash under evaluation. Consider contact vs atopic vs infectious causes based on exam.",
      plan: "Emollients, avoid triggers. Short course topical steroid if indicated after exam. Antihistamine for itch if no contraindication. Biopsy/referral if atypical.",
      items: [
        {
          medicationName: "Hydrocortisone cream 1%",
          dosage: "Thin layer",
          frequency: "Twice daily",
          duration: "7 days",
          instructions: "Apply to affected skin only; avoid face/groin unless directed.",
        },
      ],
      notes: "Dermatology supportive draft — confirm exam findings first.",
    };
  }

  return null;
}

/**
 * Deterministic clinic-demo assistant — no API key required.
 * Keyword templates only; always requires clinician edit.
 */
export function draftEncounterLocal(ctx: ClinicalContext): EncounterDraft {
  const complaint =
    ctx.chiefComplaint.trim() || "General visit / unspecified complaint";
  const rule = matchRule(complaint);

  const assessmentParts = [
    rule?.assessment ??
      `Working assessment for “${complaint}”. Differential remains open pending exam and history.`,
    conditionLine(ctx.conditions),
    allergyLine(ctx.allergies),
  ];

  const planParts = [
    rule?.plan ??
      "Complete history and exam. Order indicated tests. Symptom-directed supportive care. Safety-net advice and follow-up timing to be set by clinician.",
    "Document shared decision-making and return precautions.",
  ];

  return {
    assessment: assessmentParts.join("\n\n"),
    plan: planParts.join("\n\n"),
    provider: AI_PROVIDERS.LOCAL,
  };
}

export function suggestPrescriptionLocal(
  ctx: ClinicalContext,
): PrescriptionDraft {
  const complaint =
    ctx.chiefComplaint.trim() || "General symptomatic care";
  const rule = matchRule(complaint);

  if (rule && rule.items.length > 0) {
    return {
      items: rule.items,
      notes: `${rule.notes} ${allergyLine(ctx.allergies)}`,
      provider: AI_PROVIDERS.LOCAL,
    };
  }

  return {
    items: [
      {
        medicationName: "Acetaminophen",
        dosage: "500 mg",
        frequency: "Every 6 hours as needed",
        duration: "3 days",
        instructions:
          "Symptom relief draft only — confirm indication, dose, and allergies.",
      },
    ],
    notes: `Generic symptomatic draft for “${complaint}”. ${allergyLine(ctx.allergies)} ${conditionLine(ctx.conditions)}`,
    provider: AI_PROVIDERS.LOCAL,
  };
}
