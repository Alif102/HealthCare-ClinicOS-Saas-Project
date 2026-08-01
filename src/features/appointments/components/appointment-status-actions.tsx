"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AppointmentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAppointmentStatusAction } from "@/features/appointments/actions";
import {
  APPOINTMENT_STATUS_LABEL,
  PATIENT_CANCELLABLE,
  STATUS_TRANSITIONS,
} from "@/features/appointments/constants";

type AppointmentStatusActionsProps = {
  appointmentId: string;
  status: AppointmentStatus;
  mode: "staff" | "patient";
};

export function AppointmentStatusActions({
  appointmentId,
  status,
  mode,
}: AppointmentStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancellationReason, setCancellationReason] = useState("");

  const nextStatuses =
    mode === "patient"
      ? PATIENT_CANCELLABLE.includes(status)
        ? (["CANCELLED"] as AppointmentStatus[])
        : []
      : STATUS_TRANSITIONS[status];

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further status changes are available.
      </p>
    );
  }

  const run = (next: AppointmentStatus) => {
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointmentId, {
        status: next,
        cancellationReason:
          next === "CANCELLED" ? cancellationReason : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marked as ${APPOINTMENT_STATUS_LABEL[next]}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {(nextStatuses.includes("CANCELLED") || mode === "patient") && (
        <div className="space-y-2">
          <Label htmlFor="cancellationReason">Cancellation reason</Label>
          <Textarea
            id="cancellationReason"
            rows={2}
            value={cancellationReason}
            disabled={isPending}
            onChange={(event) => setCancellationReason(event.target.value)}
            placeholder="Optional"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((next) => (
          <Button
            key={next}
            type="button"
            variant={next === "CANCELLED" || next === "NO_SHOW" ? "outline" : "default"}
            disabled={isPending}
            onClick={() => run(next)}
          >
            {APPOINTMENT_STATUS_LABEL[next]}
          </Button>
        ))}
      </div>
    </div>
  );
}
