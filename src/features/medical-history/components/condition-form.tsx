"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createConditionAction,
  updateConditionAction,
} from "@/features/medical-history/actions";
import { CONDITION_STATUS_OPTIONS } from "@/features/medical-history/constants";
import {
  conditionSchema,
  type ConditionInput,
} from "@/features/medical-history/schemas";

type ConditionFormProps = {
  patientProfileId: string;
  conditionId?: string;
  defaultValues?: Partial<ConditionInput>;
  onDone?: () => void;
};

export function ConditionForm({
  patientProfileId,
  conditionId,
  defaultValues,
  onDone,
}: ConditionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConditionInput>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      status: defaultValues?.status ?? "active",
      diagnosedAt: defaultValues?.diagnosedAt ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = conditionId
        ? await updateConditionAction(conditionId, values)
        : await createConditionAction(patientProfileId, values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(conditionId ? "Condition updated" : "Condition added");
      reset({
        name: "",
        status: "active",
        diagnosedAt: "",
        notes: "",
      });
      onDone?.();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Condition</Label>
          <Input id="name" disabled={isPending} {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("status")}
          >
            {CONDITION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="diagnosedAt">Diagnosed on</Label>
          <Input
            id="diagnosedAt"
            type="date"
            disabled={isPending}
            {...register("diagnosedAt")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={2}
            disabled={isPending}
            {...register("notes")}
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Saving…"
          : conditionId
            ? "Update condition"
            : "Add condition"}
      </Button>
    </form>
  );
}
