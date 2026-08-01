import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  REPORT_PRESETS,
  defaultReportFrom,
  defaultReportTo,
} from "@/features/reports/constants";
import { cn } from "@/lib/utils";

type DoctorOption = {
  id: string;
  user: { name: string };
};

type ReportFiltersProps = {
  from: string;
  to: string;
  doctorProfileId?: string;
  showDoctorFilter: boolean;
  doctors: DoctorOption[];
};

export function ReportFilters({
  from,
  to,
  doctorProfileId,
  showDoctorFilter,
  doctors,
}: ReportFiltersProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-3">
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        action="/reports"
        method="get"
      >
        <div className="space-y-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={to} required />
        </div>
        {showDoctorFilter ? (
          <div className="space-y-1">
            <label
              htmlFor="doctorProfileId"
              className="text-xs text-muted-foreground"
            >
              Doctor
            </label>
            <select
              id="doctorProfileId"
              name="doctorProfileId"
              defaultValue={doctorProfileId ?? ""}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex items-end">
          <button type="submit" className={cn(buttonVariants(), "w-full")}>
            Apply range
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {REPORT_PRESETS.map((preset) => {
          const href = `/reports?from=${defaultReportFrom(preset.days)}&to=${defaultReportTo()}${
            doctorProfileId ? `&doctorProfileId=${doctorProfileId}` : ""
          }`;
          return (
            <Link
              key={preset.days}
              href={href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {preset.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
