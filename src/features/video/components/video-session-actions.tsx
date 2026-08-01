"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  createConsultationSessionAction,
  endConsultationSessionAction,
} from "@/features/video/actions";
import {
  VIDEO_SESSION_STATUS_LABEL,
  type VideoSessionStatus,
} from "@/features/video/constants";
import { cn } from "@/lib/utils";

type VideoSessionCardProps = {
  appointmentId: string;
  session: {
    id: string;
    status: VideoSessionStatus;
    joinUrl: string | null;
  } | null;
  canPrepare: boolean;
  canJoin: boolean;
  canEnd: boolean;
};

export function VideoSessionActions({
  appointmentId,
  session,
  canPrepare,
  canJoin,
  canEnd,
}: VideoSessionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const prepare = () => {
    startTransition(async () => {
      const result = await createConsultationSessionAction({ appointmentId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Video room ready");
      router.refresh();
    });
  };

  const endSession = () => {
    if (!session) return;
    startTransition(async () => {
      const result = await endConsultationSessionAction({
        sessionId: session.id,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Consultation ended");
      router.refresh();
    });
  };

  if (!session) {
    if (!canPrepare) {
      return (
        <p className="text-sm text-muted-foreground">
          Waiting for clinic staff or your doctor to prepare the video room.
        </p>
      );
    }

    return (
      <Button type="button" disabled={isPending} onClick={prepare}>
        Prepare video room
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="text-muted-foreground">Status:</span>{" "}
        <span className="font-medium">
          {VIDEO_SESSION_STATUS_LABEL[session.status]}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {canJoin && session.status !== "ENDED" ? (
          <Link
            href={`/video/${session.id}`}
            className={cn(buttonVariants())}
          >
            Join consultation
          </Link>
        ) : null}
        {session.joinUrl && session.status !== "ENDED" ? (
          <a
            href={session.joinUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open in new tab
          </a>
        ) : null}
        {canEnd && session.status !== "ENDED" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={endSession}
          >
            End session
          </Button>
        ) : null}
      </div>
    </div>
  );
}
