"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAllergyAction,
  updateAllergyAction,
} from "@/features/medical-history/actions";
import { ALLERGY_SEVERITY_OPTIONS } from "@/features/medical-history/constants";
import {
  allergySchema,
  type AllergyInput,
} from "@/features/medical-history/schemas";

type AllergyFormProps = {
  patientProfileId: string;
  allergyId?: string;
  defaultValues?: Partial<AllergyInput>;
  onDone?: () => void;
};

export function AllergyForm({
  patientProfileId,
  allergyId,
  defaultValues,
  onDone,
}: AllergyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllergyInput>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: defaultValues?.allergen ?? "",
      reaction: defaultValues?.reaction ?? "",
      severity: defaultValues?.severity ?? "unknown",
      notedAt: defaultValues?.notedAt ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = allergyId
        ? await updateAllergyAction(allergyId, values)
        : await createAllergyAction(patientProfileId, values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(allergyId ? "Allergy updated" : "Allergy added");
      reset({
        allergen: "",
        reaction: "",
        severity: "unknown",
        notedAt: "",
      });
      onDone?.();
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="allergen">Allergen</Label>
          <Input id="allergen" disabled={isPending} {...register("allergen")} />
          {errors.allergen ? (
            <p className="text-sm text-destructive">{errors.allergen.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <select
            id="severity"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("severity")}
          >
            {ALLERGY_SEVERITY_OPTIONS.map((severity) => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reaction">Reaction</Label>
          <Input id="reaction" disabled={isPending} {...register("reaction")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notedAt">Noted on</Label>
          <Input
            id="notedAt"
            type="date"
            disabled={isPending}
            {...register("notedAt")}
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : allergyId ? "Update allergy" : "Add allergy"}
      </Button>
    </form>
  );
}
