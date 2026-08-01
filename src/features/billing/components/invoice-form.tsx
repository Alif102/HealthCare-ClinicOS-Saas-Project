"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createInvoiceAction,
  updateInvoiceAction,
} from "@/features/billing/actions";
import { decimalToInput } from "@/features/billing/money";
import {
  invoiceFormSchema,
  type InvoiceFormInput,
} from "@/features/billing/schemas";

type PatientOption = {
  id: string;
  user: { name: string; email: string };
};

type AppointmentOption = {
  id: string;
  startAt: Date | string;
  patientProfileId: string;
  suggestedSubtotal?: string;
  label: string;
};

type InvoiceFormProps = {
  mode: "create" | "edit";
  invoiceId?: string;
  patients: PatientOption[];
  appointments: AppointmentOption[];
  defaultValues?: Partial<InvoiceFormInput>;
  lockPatient?: boolean;
};

export function InvoiceForm({
  mode,
  invoiceId,
  patients,
  appointments,
  defaultValues,
  lockPatient,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialPatientId =
    defaultValues?.patientProfileId ?? patients[0]?.id ?? "";
  const [patientProfileId, setPatientProfileId] = useState(initialPatientId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      patientProfileId: initialPatientId,
      appointmentId: defaultValues?.appointmentId ?? "",
      subtotal: defaultValues?.subtotal ?? "75.00",
      tax: defaultValues?.tax ?? "0.00",
      currency: defaultValues?.currency ?? "USD",
      dueAt: defaultValues?.dueAt ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const filteredAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.patientProfileId === patientProfileId,
      ),
    [appointments, patientProfileId],
  );

  const subtotal = watch("subtotal");
  const tax = watch("tax");

  const totalPreview = (() => {
    const sub = Number(subtotal || 0);
    const taxAmount = Number(tax || 0);
    if (!Number.isFinite(sub) || !Number.isFinite(taxAmount)) return "—";
    return decimalToInput(sub + taxAmount);
  })();

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createInvoiceAction(values)
          : await updateInvoiceAction(invoiceId!, values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Invoice created" : "Invoice updated");
      router.push(`/billing/${result.invoiceId}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientProfileId">Patient</Label>
          <select
            id="patientProfileId"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            disabled={lockPatient || mode === "edit"}
            {...register("patientProfileId", {
              onChange: (event) => {
                const next = event.target.value;
                setPatientProfileId(next);
                setValue("appointmentId", "");
              },
            })}
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.user.name} · {patient.user.email}
              </option>
            ))}
          </select>
          {errors.patientProfileId ? (
            <p className="text-xs text-destructive">
              {errors.patientProfileId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentId">Appointment (optional)</Label>
          <select
            id="appointmentId"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            {...register("appointmentId", {
              onChange: (event) => {
                const id = event.target.value;
                const match = filteredAppointments.find((row) => row.id === id);
                if (match?.suggestedSubtotal) {
                  setValue("subtotal", match.suggestedSubtotal);
                }
              },
            })}
          >
            <option value="">No linked visit</option>
            {filteredAppointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtotal">Subtotal</Label>
          <Input id="subtotal" inputMode="decimal" {...register("subtotal")} />
          {errors.subtotal ? (
            <p className="text-xs text-destructive">{errors.subtotal.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax">Tax</Label>
          <Input id="tax" inputMode="decimal" {...register("tax")} />
          {errors.tax ? (
            <p className="text-xs text-destructive">{errors.tax.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" maxLength={3} {...register("currency")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueAt">Due date</Label>
          <Input id="dueAt" type="date" {...register("dueAt")} />
          {errors.dueAt ? (
            <p className="text-xs text-destructive">{errors.dueAt.message}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Total: </span>
        <span className="font-medium tabular-nums">{totalPreview}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create draft" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push(invoiceId ? `/billing/${invoiceId}` : "/billing")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
