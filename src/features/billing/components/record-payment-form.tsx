"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPaymentAction } from "@/features/billing/actions";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_OPTIONS,
} from "@/features/billing/constants";
import {
  recordPaymentSchema,
  type RecordPaymentInput,
} from "@/features/billing/schemas";

type RecordPaymentFormProps = {
  invoiceId: string;
  remainingBalance: string;
};

export function RecordPaymentForm({
  invoiceId,
  remainingBalance,
}: RecordPaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: remainingBalance,
      method: "CASH",
      reference: "",
      paidAt: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await recordPaymentAction(invoiceId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment recorded");
      reset({
        amount: "0.00",
        method: "CASH",
        reference: "",
        paidAt: new Date().toISOString().slice(0, 10),
      });
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Remaining balance:{" "}
        <span className="font-medium text-foreground tabular-nums">
          {remainingBalance}
        </span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" inputMode="decimal" {...register("amount")} />
          {errors.amount ? (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <select
            id="method"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            {...register("method")}
          >
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABEL[method]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidAt">Paid on</Label>
          <Input id="paidAt" type="date" {...register("paidAt")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            placeholder="Receipt # / check #"
            {...register("reference")}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        Record payment
      </Button>
    </form>
  );
}
