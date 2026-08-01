import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APPOINTMENT_STATUS_LABEL } from "@/features/appointments/constants";
import {
  resolveVideoSessionStatus,
  VIDEO_SESSION_STATUS_LABEL,
} from "@/features/video/constants";
import { cn } from "@/lib/utils";

type VideoListItem = {
  id: string;
  startAt: Date;
  status: keyof typeof APPOINTMENT_STATUS_LABEL;
  doctorProfile: { user: { name: string } };
  patientProfile: { user: { name: string } };
  consultation: {
    id: string;
    startedAt: Date | null;
    endedAt: Date | null;
  } | null;
};

type VideoAppointmentListProps = {
  appointments: VideoListItem[];
  title?: string;
  description?: string;
};

export function VideoAppointmentList({
  appointments,
  title = "Video consultations",
  description = "Telehealth visits with in-app join links.",
}: VideoAppointmentListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="font-medium">No video appointments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Book an appointment with type “Video” to enable a consultation room.
          </p>
          <Link
            href="/appointments/new"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Book appointment
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Visit</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="font-medium hover:underline"
                      >
                        {appointment.startAt.toISOString().slice(0, 10)} ·{" "}
                        {appointment.startAt.toISOString().slice(11, 16)} UTC
                      </Link>
                    </TableCell>
                    <TableCell>{appointment.patientProfile.user.name}</TableCell>
                    <TableCell>{appointment.doctorProfile.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {APPOINTMENT_STATUS_LABEL[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.consultation ? (
                        (() => {
                          const roomStatus = resolveVideoSessionStatus(
                            appointment.consultation,
                          );
                          if (roomStatus === "ENDED") {
                            return (
                              <span className="text-sm text-muted-foreground">
                                Ended
                              </span>
                            );
                          }
                          return (
                            <Link
                              href={`/video/${appointment.consultation.id}`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                              )}
                            >
                              {VIDEO_SESSION_STATUS_LABEL[roomStatus]} · Join
                            </Link>
                          );
                        })()
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not prepared
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
