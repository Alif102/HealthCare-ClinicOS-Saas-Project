"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createAvailabilityAction } from "@/features/doctors/actions";
import { DAY_OPTIONS, SLOT_OPTIONS } from "@/features/doctors/constants";
import {
  availabilitySchema,
  type AvailabilityInput,
} from "@/features/doctors/schemas";

type AvailabilityFormProps = {
  doctorId: string;
};

export function AvailabilityForm({ doctorId }: AvailabilityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvailabilityInput>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
      slotMinutes: 30,
      isActive: true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAvailabilityAction(doctorId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Availability added");
      reset({
        dayOfWeek: values.dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        slotMinutes: 30,
        isActive: true,
      });
      router.refresh();
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border/70 p-4"
      noValidate
    >
      <div>
        <h3 className="font-medium">Add weekly slot</h3>
        <p className="text-sm text-muted-foreground">
          Times use the clinic timezone (24-hour).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Day</Label>
          <select
            id="dayOfWeek"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("dayOfWeek")}
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slotMinutes">Slot length</Label>
          <select
            id="slotMinutes"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("slotMinutes", { valueAsNumber: true })}
          >
            {SLOT_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start</Label>
          <Input
            id="startTime"
            type="time"
            disabled={isPending}
            {...register("startTime")}
          />
          {errors.startTime ? (
            <p className="text-sm text-destructive">{errors.startTime.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End</Label>
          <Input
            id="endTime"
            type="time"
            disabled={isPending}
            {...register("endTime")}
          />
          {errors.endTime ? (
            <p className="text-sm text-destructive">{errors.endTime.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add availability"}
      </Button>
    </form>
  );
}
