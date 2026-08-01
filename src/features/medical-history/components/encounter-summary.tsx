import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EncounterSummaryItem = {
  id: string;
  chiefComplaint: string | null;
  createdAt: Date;
  doctorProfile: {
    user: { name: string };
  };
  appointment: {
    id: string;
    startAt: Date;
  };
};

type EncounterSummaryProps = {
  encounters: EncounterSummaryItem[];
};

export function EncounterSummary({ encounters }: EncounterSummaryProps) {
  if (encounters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No visit notes recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {encounters.map((encounter) => (
        <li
          key={encounter.id}
          className="flex flex-col gap-2 rounded-xl border border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">
              {encounter.appointment.startAt.toISOString().slice(0, 10)} ·{" "}
              {encounter.doctorProfile.user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {encounter.chiefComplaint || "No chief complaint recorded"}
            </p>
          </div>
          <Link
            href={`/encounters/${encounter.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open notes
          </Link>
        </li>
      ))}
    </ul>
  );
}
