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
import { createDoctorAction } from "@/features/doctors/actions";
import {
  createDoctorSchema,
  type CreateDoctorInput,
} from "@/features/doctors/schemas";

export function CreateDoctorForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDoctorInput>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      specialty: "",
      licenseNumber: "",
      bio: "",
      consultationFee: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createDoctorAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Doctor created");
      router.push(`/doctors/${result.doctorId}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" disabled={isPending} {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            disabled={isPending}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Temporary password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty</Label>
          <Input id="specialty" disabled={isPending} {...register("specialty")} />
          {errors.specialty ? (
            <p className="text-sm text-destructive">{errors.specialty.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">License number</Label>
          <Input
            id="licenseNumber"
            disabled={isPending}
            {...register("licenseNumber")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consultationFee">Consultation fee (USD)</Label>
          <Input
            id="consultationFee"
            inputMode="decimal"
            placeholder="75.00"
            disabled={isPending}
            {...register("consultationFee")}
          />
          {errors.consultationFee ? (
            <p className="text-sm text-destructive">
              {errors.consultationFee.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} disabled={isPending} {...register("bio")} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create doctor"}
      </Button>
    </form>
  );
}
