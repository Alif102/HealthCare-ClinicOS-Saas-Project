export const ALLERGY_SEVERITY_OPTIONS = [
  "mild",
  "moderate",
  "severe",
  "unknown",
] as const;

export const ALLERGY_SEVERITY_LABEL: Record<
  (typeof ALLERGY_SEVERITY_OPTIONS)[number],
  string
> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  unknown: "Unknown",
};

export const CONDITION_STATUS_OPTIONS = [
  "active",
  "chronic",
  "resolved",
] as const;

export const CONDITION_STATUS_LABEL: Record<
  (typeof CONDITION_STATUS_OPTIONS)[number],
  string
> = {
  active: "Active",
  chronic: "Chronic",
  resolved: "Resolved",
};
