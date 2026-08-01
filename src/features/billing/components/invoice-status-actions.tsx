"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { InvoiceStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { updateInvoiceStatusAction } from "@/features/billing/actions";
import {
  INVOICE_STATUS_LABEL,
  STATUS_TRANSITIONS,
} from "@/features/billing/constants";

type InvoiceStatusActionsProps = {
  invoiceId: string;
  status: InvoiceStatus;
};

export function InvoiceStatusActions({
  invoiceId,
  status,
}: InvoiceStatusActionsProps) {
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

  const run = (next: InvoiceStatus) => {
    startTransition(async () => {
      const result = await updateInvoiceStatusAction(invoiceId, {
        status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marked as ${INVOICE_STATUS_LABEL[next]}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => (
        <Button
          key={next}
          type="button"
          variant={next === "VOID" ? "outline" : "default"}
          disabled={isPending}
          onClick={() => run(next)}
        >
          {next === "PENDING"
            ? "Issue invoice"
            : next === "OVERDUE"
              ? "Mark overdue"
              : INVOICE_STATUS_LABEL[next]}
        </Button>
      ))}
    </div>
  );
}
