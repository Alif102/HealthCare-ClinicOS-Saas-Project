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
import { createPatientAction } from "@/features/patients/actions";
import { BLOOD_TYPE_OPTIONS } from "@/features/patients/constants";
import {
  createPatientSchema,
  GENDER_OPTIONS,
  type CreatePatientInput,
} from "@/features/patients/schemas";

export function CreatePatientForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      dateOfBirth: "",
      gender: "UNSPECIFIED",
      bloodType: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      address: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPatientAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Patient registered");
      router.push(`/patients/${result.patientId}`);
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
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" disabled={isPending} {...register("phone")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            disabled={isPending}
            {...register("dateOfBirth")}
          />
          {errors.dateOfBirth ? (
            <p className="text-sm text-destructive">
              {errors.dateOfBirth.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("gender")}
          >
            {GENDER_OPTIONS.map((gender) => (
              <option key={gender} value={gender}>
                {gender.charAt(0) + gender.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodType">Blood type</Label>
          <select
            id="bloodType"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            disabled={isPending}
            {...register("bloodType")}
          >
            <option value="">Select</option>
            {BLOOD_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency contact</Label>
          <Input
            id="emergencyContactName"
            disabled={isPending}
            {...register("emergencyContactName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Emergency phone</Label>
          <Input
            id="emergencyContactPhone"
            disabled={isPending}
            {...register("emergencyContactPhone")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          rows={3}
          disabled={isPending}
          {...register("address")}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Registering…" : "Register patient"}
      </Button>
    </form>
  );
}
