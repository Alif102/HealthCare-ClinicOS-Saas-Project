import { describe, expect, it } from "vitest";

import {
  draftEncounterLocal,
  suggestPrescriptionLocal,
} from "@/features/ai/local";
import { AI_PROVIDERS } from "@/features/ai/constants";

const baseCtx = {
  chiefComplaint: "",
  allergies: [] as string[],
  conditions: [] as string[],
};

describe("draftEncounterLocal", () => {
  it("uses URI template for cough complaints", () => {
    const draft = draftEncounterLocal({
      ...baseCtx,
      chiefComplaint: "Persistent cough and sore throat",
      allergies: ["Penicillin"],
      conditions: ["Asthma"],
    });

    expect(draft.provider).toBe(AI_PROVIDERS.LOCAL);
    expect(draft.assessment).toMatch(/upper respiratory/i);
    expect(draft.assessment).toMatch(/Penicillin/);
    expect(draft.assessment).toMatch(/Asthma/);
    expect(draft.plan).toMatch(/Supportive care/i);
  });

  it("falls back for unknown complaints", () => {
    const draft = draftEncounterLocal({
      ...baseCtx,
      chiefComplaint: "Odd tingling",
    });
    expect(draft.assessment).toMatch(/Odd tingling/);
    expect(draft.plan).toMatch(/Complete history/i);
  });
});

describe("suggestPrescriptionLocal", () => {
  it("suggests headache meds", () => {
    const draft = suggestPrescriptionLocal({
      ...baseCtx,
      chiefComplaint: "Migraine headache",
      allergies: ["NSAIDs"],
    });

    expect(draft.items[0]?.medicationName).toBe("Ibuprofen");
    expect(draft.notes).toMatch(/NSAIDs/);
  });

  it("uses generic draft when template has no items", () => {
    const draft = suggestPrescriptionLocal({
      ...baseCtx,
      chiefComplaint: "Routine follow-up",
    });
    expect(draft.items[0]?.medicationName).toBe("Acetaminophen");
  });
});
