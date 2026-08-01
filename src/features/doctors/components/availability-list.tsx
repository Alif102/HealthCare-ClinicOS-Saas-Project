"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAvailabilityAction,
  toggleAvailabilityAction,
} from "@/features/doctors/actions";
import { DAY_LABEL } from "@/features/doctors/constants";
import type { DayOfWeek } from "@prisma/client";

type AvailabilityRow = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
};

type AvailabilityListProps = {
  rows: AvailabilityRow[];
  canManage: boolean;
};

export function AvailabilityList({ rows, canManage }: AvailabilityListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
        No weekly availability yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Slot</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{DAY_LABEL[row.dayOfWeek]}</TableCell>
              <TableCell>
                {row.startTime} – {row.endTime}
              </TableCell>
              <TableCell>{row.slotMinutes} min</TableCell>
              <TableCell>
                <Badge variant={row.isActive ? "default" : "secondary"}>
                  {row.isActive ? "Active" : "Off"}
                </Badge>
              </TableCell>
              {canManage ? (
                <TableCell className="space-x-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await toggleAvailabilityAction(row.id);
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                  >
                    {row.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deleteAvailabilityAction(row.id);
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Availability removed");
                        router.refresh();
                      });
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
