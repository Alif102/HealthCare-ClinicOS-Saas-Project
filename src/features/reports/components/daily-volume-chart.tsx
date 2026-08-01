import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyVolumeRow } from "@/features/reports/queries";

type DailyVolumeChartProps = {
  rows: DailyVolumeRow[];
};

export function DailyVolumeChart({ rows }: DailyVolumeChartProps) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  const dense = rows.length > 45;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily appointment volume</CardTitle>
        <CardDescription>
          Visits scheduled per UTC day in the selected range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.every((row) => row.count === 0) ? (
          <p className="text-sm text-muted-foreground">
            No appointments in this range.
          </p>
        ) : (
          <div className="space-y-2">
            <div
              className="flex h-36 items-end gap-px sm:gap-0.5"
              role="img"
              aria-label="Daily appointment counts"
            >
              {rows.map((row) => {
                const height = Math.max(
                  row.count === 0 ? 0 : 8,
                  Math.round((row.count / max) * 100),
                );
                return (
                  <div
                    key={row.date}
                    className="group relative flex min-w-0 flex-1 flex-col justify-end"
                    title={`${row.date}: ${row.count}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-teal-700/75 transition-colors group-hover:bg-teal-800"
                      style={{ height: `${height}%` }}
                    />
                    {!dense ? (
                      <span className="sr-only">
                        {row.date}: {row.count}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{rows[0]?.date}</span>
              <span>{rows[rows.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
