"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SuggestRxAssist } from "@/features/ai/components/suggest-rx-assist";
import {
  createPrescriptionAction,
  updatePrescriptionAction,
} from "@/features/prescriptions/actions";
import {
  prescriptionFormSchema,
  type PrescriptionFormInput,
} from "@/features/prescriptions/schemas";

type PatientOption = {
  id: string;
  user: { name: string; email: string };
};

type AppointmentOption = {
  id: string;
  startAt: Date | string;
  patientProfileId: string;
  label: string;
};

type PrescriptionFormProps = {
  mode: "create" | "edit";
  prescriptionId?: string;
  patients: PatientOption[];
  appointments: AppointmentOption[];
  defaultValues?: Partial<PrescriptionFormInput>;
  lockPatient?: boolean;
};

const emptyItem = {
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
  quantity: "",
};

export function PrescriptionForm({
  mode,
  prescriptionId,
  patients,
  appointments,
  defaultValues,
  lockPatient,
}: PrescriptionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialPatientId =
    defaultValues?.patientProfileId ?? patients[0]?.id ?? "";
  const [patientProfileId, setPatientProfileId] = useState(initialPatientId);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PrescriptionFormInput>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patientProfileId: initialPatientId,
      appointmentId: defaultValues?.appointmentId ?? "",
      notes: defaultValues?.notes ?? "",
      items: defaultValues?.items?.length
        ? defaultValues.items
        : [{ ...emptyItem }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const filteredAppointments = appointments.filter(
    (appointment) =>
      !patientProfileId || appointment.patientProfileId === patientProfileId,
  );

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPrescriptionAction(values)
          : await updatePrescriptionAction(prescriptionId!, values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Draft prescription saved" : "Draft updated");
      router.push(`/prescriptions/${result.prescriptionId}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientProfileId">Patient</Label>
          <select
            id="patientProfileId"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            disabled={isPending || lockPatient || mode === "edit"}
            value={patientProfileId}
            onChange={(event) => {
              const next = event.target.value;
              setPatientProfileId(next);
              setValue("patientProfileId", next, { shouldValidate: true });
              setValue("appointmentId", "");
            }}
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.user.name} · {patient.user.email}
              </option>
            ))}
          </select>
          {errors.patientProfileId ? (
            <p className="text-sm text-destructive">
              {errors.patientProfileId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentId">Linked appointment (optional)</Label>
          <select
            id="appointmentId"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("appointmentId")}
          >
            <option value="">None</option>
            {filteredAppointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          disabled={isPending}
          {...register("notes")}
        />
      </div>

      <SuggestRxAssist
        patientProfileId={patientProfileId}
        getClinicalHint={() => getValues("notes") ?? ""}
        onSuggest={(draft) => {
          replace(
            draft.items.map((item) => ({
              medicationName: item.medicationName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              quantity: "",
            })),
          );
          if (draft.notes) {
            setValue("notes", draft.notes, { shouldDirty: true });
          }
        }}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Medications</h2>
            <p className="text-xs text-muted-foreground">
              Free-text fields — no formulary lookup in this phase.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => append({ ...emptyItem })}
          >
            Add medication
          </Button>
        </div>

        {errors.items?.root ? (
          <p className="text-sm text-destructive">{errors.items.root.message}</p>
        ) : null}
        {typeof errors.items?.message === "string" ? (
          <p className="text-sm text-destructive">{errors.items.message}</p>
        ) : null}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-3 rounded-xl border border-border/70 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Item {index + 1}</p>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`items.${index}.medicationName`}>
                    Medication
                  </Label>
                  <Input
                    id={`items.${index}.medicationName`}
                    disabled={isPending}
                    {...register(`items.${index}.medicationName`)}
                  />
                  {errors.items?.[index]?.medicationName ? (
                    <p className="text-sm text-destructive">
                      {errors.items[index]?.medicationName?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.dosage`}>Dosage</Label>
                  <Input
                    id={`items.${index}.dosage`}
                    placeholder="e.g. 500mg"
                    disabled={isPending}
                    {...register(`items.${index}.dosage`)}
                  />
                  {errors.items?.[index]?.dosage ? (
                    <p className="text-sm text-destructive">
                      {errors.items[index]?.dosage?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.frequency`}>Frequency</Label>
                  <Input
                    id={`items.${index}.frequency`}
                    placeholder="e.g. Twice daily"
                    disabled={isPending}
                    {...register(`items.${index}.frequency`)}
                  />
                  {errors.items?.[index]?.frequency ? (
                    <p className="text-sm text-destructive">
                      {errors.items[index]?.frequency?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.duration`}>Duration</Label>
                  <Input
                    id={`items.${index}.duration`}
                    placeholder="e.g. 7 days"
                    disabled={isPending}
                    {...register(`items.${index}.duration`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    inputMode="numeric"
                    disabled={isPending}
                    {...register(`items.${index}.quantity`)}
                  />
                  {errors.items?.[index]?.quantity ? (
                    <p className="text-sm text-destructive">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`items.${index}.instructions`}>
                    Instructions
                  </Label>
                  <Input
                    id={`items.${index}.instructions`}
                    disabled={isPending}
                    {...register(`items.${index}.instructions`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Saving…"
          : mode === "create"
            ? "Save draft"
            : "Update draft"}
      </Button>
    </form>
  );
}
