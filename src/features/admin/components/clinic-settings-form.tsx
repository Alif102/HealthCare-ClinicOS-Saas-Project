"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateClinicSettingsAction } from "@/features/admin/actions";
import { TIMEZONE_OPTIONS } from "@/features/admin/constants";
import {
  clinicSettingsSchema,
  type ClinicSettingsInput,
} from "@/features/admin/schemas";

type ClinicSettingsFormProps = {
  defaultValues: ClinicSettingsInput;
};

export function ClinicSettingsForm({ defaultValues }: ClinicSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClinicSettingsInput>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues,
  });

  const isActive = watch("isActive");
  const aiAssistEnabled = watch("aiAssistEnabled");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateClinicSettingsAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Clinic settings saved");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Clinic name</Label>
        <Input id="name" disabled={isPending} {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Contact email</Label>
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
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" disabled={isPending} {...register("phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          rows={2}
          disabled={isPending}
          {...register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          disabled={isPending}
          {...register("timezone")}
        >
          {TIMEZONE_OPTIONS.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-3">
        <div>
          <p className="text-sm font-medium">Clinic active</p>
          <p className="text-xs text-muted-foreground">
            Inactive clinics are flagged for oversight (demo flag).
          </p>
        </div>
        <Switch
          checked={isActive}
          disabled={isPending}
          onCheckedChange={(checked) =>
            setValue("isActive", checked, { shouldDirty: true })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-3">
        <div>
          <p className="text-sm font-medium">AI assist</p>
          <p className="text-xs text-muted-foreground">
            Allow doctors to use draft notes and Rx suggestions.
          </p>
        </div>
        <Switch
          checked={aiAssistEnabled}
          disabled={isPending}
          onCheckedChange={(checked) =>
            setValue("aiAssistEnabled", checked, { shouldDirty: true })
          }
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
