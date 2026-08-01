"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  bookAppointmentAction,
  getAvailableSlotsAction,
} from "@/features/appointments/actions";
import { APPOINTMENT_TYPE_LABEL } from "@/features/appointments/constants";
import {
  bookAppointmentSchema,
  type BookAppointmentInput,
} from "@/features/appointments/schemas";
import type { BookableSlot } from "@/features/appointments/slots";

type DoctorOption = {
  id: string;
  specialty: string;
  user: { name: string };
};

type PatientOption = {
  id: string;
  user: { name: string; email: string };
};

type BookAppointmentFormProps = {
  doctors: DoctorOption[];
  patients: PatientOption[];
  lockedPatientId?: string;
  lockedDoctorId?: string;
  showNotes: boolean;
};

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BookAppointmentForm({
  doctors,
  patients,
  lockedPatientId,
  lockedDoctorId,
  showNotes,
}: BookAppointmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<BookableSlot[] | null>(null);

  const initialDoctorId = lockedDoctorId ?? doctors[0]?.id ?? "";
  const [doctorProfileId, setDoctorProfileId] = useState(initialDoctorId);
  const [date, setDate] = useState(todayUtcDate());

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BookAppointmentInput>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: {
      doctorProfileId: initialDoctorId,
      patientProfileId: lockedPatientId ?? patients[0]?.id ?? "",
      startAt: "",
      type: "IN_PERSON",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!doctorProfileId || !date) {
      return;
    }

    let cancelled = false;

    void getAvailableSlotsAction({ doctorProfileId, date }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error);
        setSlots([]);
        return;
      }
      setSlots(result.slots);
    });

    return () => {
      cancelled = true;
    };
  }, [doctorProfileId, date]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await bookAppointmentAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment booked");
      router.push(`/appointments/${result.appointmentId}`);
      router.refresh();
    });
  });

  const slotsLoading = slots === null;
  const openSlots = slots ?? [];

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doctorProfileId">Doctor</Label>
          <select
            id="doctorProfileId"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            disabled={isPending || Boolean(lockedDoctorId)}
            value={doctorProfileId}
            onChange={(event) => {
              const next = event.target.value;
              setDoctorProfileId(next);
              setValue("doctorProfileId", next, { shouldValidate: true });
              setValue("startAt", "");
              setSlots(null);
            }}
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.user.name} · {doctor.specialty}
              </option>
            ))}
          </select>
          {errors.doctorProfileId ? (
            <p className="text-sm text-destructive">
              {errors.doctorProfileId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientProfileId">Patient</Label>
          <select
            id="patientProfileId"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            disabled={isPending || Boolean(lockedPatientId)}
            {...register("patientProfileId")}
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date (UTC)</Label>
          <Input
            id="date"
            type="date"
            min={todayUtcDate()}
            value={date}
            disabled={isPending}
            onChange={(event) => {
              setDate(event.target.value);
              setValue("startAt", "");
              setSlots(null);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Visit type</Label>
          <select
            id="type"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("type")}
          >
            {(
              Object.keys(APPOINTMENT_TYPE_LABEL) as Array<
                keyof typeof APPOINTMENT_TYPE_LABEL
              >
            ).map((type) => (
              <option key={type} value={type}>
                {APPOINTMENT_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startAt">Available slots</Label>
        {slotsLoading ? (
          <p className="text-sm text-muted-foreground">Loading open slots…</p>
        ) : openSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open slots for this doctor on that date. Check weekly
            availability or try another day.
          </p>
        ) : (
          <select
            id="startAt"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("startAt")}
          >
            <option value="">Select a slot</option>
            {openSlots.map((slot) => (
              <option key={slot.startAt} value={slot.startAt}>
                {slot.label}
              </option>
            ))}
          </select>
        )}
        {errors.startAt ? (
          <p className="text-sm text-destructive">{errors.startAt.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" disabled={isPending} {...register("reason")} />
      </div>

      {showNotes ? (
        <div className="space-y-2">
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea
            id="notes"
            rows={3}
            disabled={isPending}
            {...register("notes")}
          />
        </div>
      ) : null}

      <Button type="submit" disabled={isPending || openSlots.length === 0}>
        {isPending ? "Booking…" : "Book appointment"}
      </Button>
    </form>
  );
}
