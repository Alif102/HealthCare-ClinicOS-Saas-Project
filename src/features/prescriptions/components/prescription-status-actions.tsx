"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { PrescriptionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { updatePrescriptionStatusAction } from "@/features/prescriptions/actions";
import {
  PRESCRIPTION_STATUS_LABEL,
  STATUS_TRANSITIONS,
} from "@/features/prescriptions/constants";

type PrescriptionStatusActionsProps = {
  prescriptionId: string;
  status: PrescriptionStatus;
};

export function PrescriptionStatusActions({
  prescriptionId,
  status,
}: PrescriptionStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextStatuses = STATUS_TRANSITIONS[status];

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further status changes are available.
      </p>
    );
  }

  const run = (next: PrescriptionStatus) => {
    startTransition(async () => {
      const result = await updatePrescriptionStatusAction(prescriptionId, {
        status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marked as ${PRESCRIPTION_STATUS_LABEL[next]}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => (
        <Button
          key={next}
          type="button"
          variant={next === "CANCELLED" ? "outline" : "default"}
          disabled={isPending}
          onClick={() => run(next)}
        >
          {next === "ACTIVE" ? "Issue prescription" : PRESCRIPTION_STATUS_LABEL[next]}
        </Button>
      ))}
    </div>
  );
}
