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
import { Textarea } from "@/components/ui/textarea";
import { updateDoctorProfileAction } from "@/features/doctors/actions";
import {
  doctorProfileSchema,
  type DoctorProfileInput,
} from "@/features/doctors/schemas";

type DoctorProfileFormProps = {
  doctorId: string;
  defaultValues: DoctorProfileInput;
};

export function DoctorProfileForm({
  doctorId,
  defaultValues,
}: DoctorProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorProfileInput>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateDoctorProfileAction(doctorId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
      router.push(`/doctors/${doctorId}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty</Label>
          <Input id="specialty" disabled={isPending} {...register("specialty")} />
          {errors.specialty ? (
            <p className="text-sm text-destructive">{errors.specialty.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">License number</Label>
          <Input
            id="licenseNumber"
            disabled={isPending}
            {...register("licenseNumber")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="consultationFee">Consultation fee (USD)</Label>
          <Input
            id="consultationFee"
            inputMode="decimal"
            disabled={isPending}
            {...register("consultationFee")}
          />
          {errors.consultationFee ? (
            <p className="text-sm text-destructive">
              {errors.consultationFee.message}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
          <div>
            <Label htmlFor="isAcceptingPatients">Accepting patients</Label>
            <p className="text-xs text-muted-foreground">
              Pause new bookings without deleting the profile.
            </p>
          </div>
          <Controller
            name="isAcceptingPatients"
            control={control}
            render={({ field }) => (
              <Switch
                id="isAcceptingPatients"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={5} disabled={isPending} {...register("bio")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push(`/doctors/${doctorId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
