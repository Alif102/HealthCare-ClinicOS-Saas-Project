import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DoctorWorkloadRow } from "@/features/reports/queries";

type DoctorWorkloadTableProps = {
  rows: DoctorWorkloadRow[];
};

export function DoctorWorkloadTable({ rows }: DoctorWorkloadTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor workload</CardTitle>
        <CardDescription>
          Appointments, completed visits, prescriptions, and encounter notes by
          clinician.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No doctors in this clinic yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead className="text-right">Appts</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Rx</TableHead>
                <TableHead className="text-right">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.doctorProfileId}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.specialty}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.appointments}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.completed}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.prescriptions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.encounters}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
