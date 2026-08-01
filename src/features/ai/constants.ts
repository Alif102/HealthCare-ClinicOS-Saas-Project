export const AI_PROVIDERS = {
  LOCAL: "local",
  OPENAI: "openai",
} as const;

export type AiProviderId =
  (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

export const AI_DISCLAIMER =
  "AI suggestions are drafts for clinician review only — not a diagnosis, prescription, or medical advice.";

/** Soft cap so prompts stay small and cheap. */
export const AI_MAX_CONTEXT_ITEMS = 12;
