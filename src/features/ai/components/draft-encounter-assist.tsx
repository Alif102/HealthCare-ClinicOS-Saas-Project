"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { draftEncounterNotesAction } from "@/features/ai/actions";
import { AiDisclaimer } from "@/features/ai/components/ai-disclaimer";
import type { AiProviderId } from "@/features/ai/constants";

type DraftEncounterAssistProps = {
  appointmentId: string;
  getChiefComplaint: () => string;
  onDraft: (draft: { assessment: string; plan: string }) => void;
};

export function DraftEncounterAssist({
  appointmentId,
  getChiefComplaint,
  onDraft,
}: DraftEncounterAssistProps) {
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<AiProviderId | null>(null);

  const run = () => {
    startTransition(async () => {
      const result = await draftEncounterNotesAction({
        appointmentId,
        chiefComplaint: getChiefComplaint(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProvider(result.draft.provider);
      onDraft({
        assessment: result.draft.assessment,
        plan: result.draft.plan,
      });
      toast.success("Draft notes inserted — review before saving");
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">AI draft assist</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={run}
        >
          {isPending ? "Drafting…" : "Draft assessment & plan"}
        </Button>
      </div>
      <AiDisclaimer provider={provider ?? undefined} />
    </div>
  );
}
