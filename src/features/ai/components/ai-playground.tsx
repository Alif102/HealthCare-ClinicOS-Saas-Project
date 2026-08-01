"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  draftEncounterNotesAction,
  suggestPrescriptionItemsAction,
} from "@/features/ai/actions";
import { AiDisclaimer } from "@/features/ai/components/ai-disclaimer";
import type { AiProviderId } from "@/features/ai/constants";

type AiPlaygroundProps = {
  appointmentId: string | null;
  patientProfileId: string | null;
  defaultHint?: string;
};

export function AiPlayground({
  appointmentId,
  patientProfileId,
  defaultHint = "",
}: AiPlaygroundProps) {
  const [hint, setHint] = useState(defaultHint);
  const [output, setOutput] = useState("");
  const [provider, setProvider] = useState<AiProviderId | null>(null);
  const [isPending, startTransition] = useTransition();

  const draftNotes = () => {
    if (!appointmentId) {
      toast.error("No appointment available for drafting notes");
      return;
    }
    startTransition(async () => {
      const result = await draftEncounterNotesAction({
        appointmentId,
        chiefComplaint: hint,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProvider(result.draft.provider);
      setOutput(
        `Assessment\n${result.draft.assessment}\n\nPlan\n${result.draft.plan}`,
      );
    });
  };

  const suggestRx = () => {
    if (!patientProfileId) {
      toast.error("No patient available for Rx suggestions");
      return;
    }
    if (hint.trim().length < 3) {
      toast.error("Enter a clinical hint first");
      return;
    }
    startTransition(async () => {
      const result = await suggestPrescriptionItemsAction({
        patientProfileId,
        clinicalHint: hint,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProvider(result.draft.provider);
      const lines = result.draft.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.medicationName} — ${item.dosage}, ${item.frequency}, ${item.duration}\n   ${item.instructions}`,
        )
        .join("\n");
      setOutput(`Notes\n${result.draft.notes}\n\nItems\n${lines}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-hint">Clinical hint (de-identified)</Label>
        <Textarea
          id="ai-hint"
          rows={3}
          value={hint}
          onChange={(event) => setHint(event.target.value)}
          placeholder="e.g. Mild cough and sore throat for 3 days"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending || !appointmentId}
          onClick={draftNotes}
        >
          Draft encounter notes
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !patientProfileId}
          onClick={suggestRx}
        >
          Suggest medications
        </Button>
      </div>

      <AiDisclaimer provider={provider ?? undefined} />

      {output ? (
        <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/30 p-4 text-sm whitespace-pre-wrap">
          {output}
        </pre>
      ) : (
        <p className="text-sm text-muted-foreground">
          Try a hint like “cough”, “headache”, or “routine follow-up” to see the
          local template provider. With OPENAI_API_KEY set, live model drafts
          are used instead.
        </p>
      )}
    </div>
  );
}
