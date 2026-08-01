import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VideoRoomLazy } from "@/features/video/components/video-room-lazy";
import { VideoSessionActions } from "@/features/video/components/video-session-actions";
import { VIDEO_SESSION_STATUS_LABEL } from "@/features/video/constants";
import { getConsultationById } from "@/features/video/queries";
import { requireTenantContext } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type VideoSessionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: VideoSessionPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Video · ${id.slice(0, 6)}` };
}

export default async function VideoSessionPage({
  params,
}: VideoSessionPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const consultation = await getConsultationById(tenantId, id);

  if (!consultation) {
    notFound();
  }

  const appointment = consultation.appointment;
  const isDoctor =
    membership.role === "DOCTOR" &&
    appointment.doctorProfile.user.id === session.user.id;
  const isPatient =
    membership.role === "PATIENT" &&
    appointment.patientProfile.user.id === session.user.id;
  const isStaff =
    membership.role === "ADMIN" || membership.role === "RECEPTIONIST";

  if (!isDoctor && !isPatient && !isStaff) {
    redirect("/video");
  }

  const canEnd = isDoctor || isStaff;
  const ended = consultation.status === "ENDED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/video"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Video consultations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Video visit
            </h1>
            <Badge variant={ended ? "secondary" : "default"}>
              {VIDEO_SESSION_STATUS_LABEL[consultation.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {appointment.patientProfile.user.name} ·{" "}
            {appointment.doctorProfile.user.name} ·{" "}
            {appointment.startAt.toISOString().slice(0, 10)}{" "}
            {appointment.startAt.toISOString().slice(11, 16)} UTC
          </p>
        </div>
        <Link
          href={`/appointments/${appointment.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Open appointment
        </Link>
      </div>

      <VideoRoomLazy
        sessionId={consultation.id}
        roomName={consultation.roomName}
        displayName={session.user.name}
        ended={ended}
      />

      {canEnd && !ended ? (
        <Card>
          <CardHeader>
            <CardTitle>Session controls</CardTitle>
            <CardDescription>
              End the room when the visit is finished. This also completes an
              in-progress appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoSessionActions
              appointmentId={appointment.id}
              session={{
                id: consultation.id,
                status: consultation.status,
                joinUrl: consultation.joinUrl,
              }}
              canPrepare={false}
              canJoin={false}
              canEnd={canEnd}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
