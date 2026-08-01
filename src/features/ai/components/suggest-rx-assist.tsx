"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { suggestPrescriptionItemsAction } from "@/features/ai/actions";
import { AiDisclaimer } from "@/features/ai/components/ai-disclaimer";
import type { AiProviderId } from "@/features/ai/constants";
import type { PrescriptionSuggestion } from "@/features/ai/types";

type SuggestRxAssistProps = {
  patientProfileId: string;
  getClinicalHint: () => string;
  onSuggest: (draft: {
    items: PrescriptionSuggestion[];
    notes: string;
  }) => void;
};

export function SuggestRxAssist({
  patientProfileId,
  getClinicalHint,
  onSuggest,
}: SuggestRxAssistProps) {
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<AiProviderId | null>(null);

  const run = () => {
    const clinicalHint = getClinicalHint().trim();
    if (clinicalHint.length < 3) {
      toast.error("Add a short clinical hint or notes first");
      return;
    }
    if (!patientProfileId) {
      toast.error("Select a patient first");
      return;
    }

    startTransition(async () => {
      const result = await suggestPrescriptionItemsAction({
        patientProfileId,
        clinicalHint,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.draft.items.length === 0) {
        toast.error("No medication suggestions returned");
        return;
      }
      setProvider(result.draft.provider);
      onSuggest({
        items: result.draft.items,
        notes: result.draft.notes,
      });
      toast.success("Draft medications inserted — review carefully");
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">AI Rx suggestions</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || !patientProfileId}
          onClick={run}
        >
          {isPending ? "Suggesting…" : "Suggest medications"}
        </Button>
      </div>
      <AiDisclaimer provider={provider ?? undefined} />
    </div>
  );
}
