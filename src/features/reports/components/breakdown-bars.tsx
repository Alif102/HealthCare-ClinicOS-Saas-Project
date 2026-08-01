import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BreakdownItem = {
  key: string;
  label: string;
  count: number;
};

type BreakdownBarsProps = {
  title: string;
  description: string;
  items: BreakdownItem[];
};

export function BreakdownBars({
  title,
  description,
  items,
}: BreakdownBarsProps) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {total > 0 ? ` · ${total} total` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.every((item) => item.count === 0) ? (
          <p className="text-sm text-muted-foreground">
            No data in this range.
          </p>
        ) : (
          items.map((item) => {
            const width = Math.round((item.count / max) * 100);
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal-700/80 transition-[width]"
                    style={{ width: `${width}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
