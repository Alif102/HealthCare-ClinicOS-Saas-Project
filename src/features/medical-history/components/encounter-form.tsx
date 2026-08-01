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
import { DraftEncounterAssist } from "@/features/ai/components/draft-encounter-assist";
import { upsertEncounterAction } from "@/features/medical-history/actions";
import {
  encounterSchema,
  type EncounterInput,
} from "@/features/medical-history/schemas";

type EncounterFormProps = {
  appointmentId: string;
  defaultValues?: Partial<EncounterInput>;
};

export function EncounterForm({
  appointmentId,
  defaultValues,
}: EncounterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EncounterInput>({
    resolver: zodResolver(encounterSchema),
    defaultValues: {
      chiefComplaint: defaultValues?.chiefComplaint ?? "",
      assessment: defaultValues?.assessment ?? "",
      plan: defaultValues?.plan ?? "",
      bloodPressure: defaultValues?.bloodPressure ?? "",
      heartRate: defaultValues?.heartRate ?? "",
      temperature: defaultValues?.temperature ?? "",
      weight: defaultValues?.weight ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertEncounterAction(appointmentId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Visit notes saved");
      router.push(`/encounters/${result.id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="chiefComplaint">Chief complaint</Label>
        <Input
          id="chiefComplaint"
          disabled={isPending}
          {...register("chiefComplaint")}
        />
      </div>

      <DraftEncounterAssist
        appointmentId={appointmentId}
        getChiefComplaint={() => getValues("chiefComplaint") ?? ""}
        onDraft={(draft) => {
          setValue("assessment", draft.assessment, { shouldDirty: true });
          setValue("plan", draft.plan, { shouldDirty: true });
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="bloodPressure">Blood pressure</Label>
          <Input
            id="bloodPressure"
            placeholder="120/80"
            disabled={isPending}
            {...register("bloodPressure")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heartRate">Heart rate</Label>
          <Input
            id="heartRate"
            placeholder="72"
            disabled={isPending}
            {...register("heartRate")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            placeholder="98.6°F"
            disabled={isPending}
            {...register("temperature")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            placeholder="70 kg"
            disabled={isPending}
            {...register("weight")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assessment">Assessment</Label>
        <Textarea
          id="assessment"
          rows={4}
          disabled={isPending}
          {...register("assessment")}
        />
        {errors.assessment ? (
          <p className="text-sm text-destructive">{errors.assessment.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Textarea
          id="plan"
          rows={4}
          disabled={isPending}
          {...register("plan")}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save visit notes"}
      </Button>
    </form>
  );
}
