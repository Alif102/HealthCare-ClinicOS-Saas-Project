import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReportSummaryCardsProps = {
  summary: {
    appointmentsTotal: number;
    appointmentsCompleted: number;
    prescriptionsTotal: number;
    encountersTotal: number;
    patientsTotal: number;
    doctorsTotal: number;
    newPatientsInRange: number;
    noShowRate: number;
    completionRate: number;
  };
  scopeLabel: string;
  showClinicRoster: boolean;
};

export function ReportSummaryCards({
  summary,
  scopeLabel,
  showClinicRoster,
}: ReportSummaryCardsProps) {
  const cards = [
    {
      title: "Appointments",
      value: summary.appointmentsTotal,
      description: `${summary.completionRate}% completed · ${summary.noShowRate}% no-show`,
    },
    {
      title: "Completed visits",
      value: summary.appointmentsCompleted,
      description: "Closed as completed in range",
    },
    {
      title: "Prescriptions",
      value: summary.prescriptionsTotal,
      description: "Orders created in range",
    },
    {
      title: "Encounter notes",
      value: summary.encountersTotal,
      description: "Visit notes written in range",
    },
    ...(showClinicRoster
      ? [
          {
            title: "Patients on file",
            value: summary.patientsTotal,
            description: `${summary.newPatientsInRange} new in range`,
          },
          {
            title: "Doctors",
            value: summary.doctorsTotal,
            description: "Active clinician profiles",
          },
        ]
      : [
          {
            title: "Patients seen",
            value: summary.patientsTotal,
            description: "Distinct patients in your range",
          },
        ]),
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {scopeLabel}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} size="sm">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
