"use client";

import { useEffect, useRef } from "react";

import { buildJitsiEmbedUrl } from "@/features/video/provider";
import { startConsultationSessionAction } from "@/features/video/actions";

type VideoRoomProps = {
  sessionId: string;
  roomName: string;
  displayName: string;
  ended: boolean;
};

export function VideoRoom({
  sessionId,
  roomName,
  displayName,
  ended,
}: VideoRoomProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (ended || startedRef.current) return;
    startedRef.current = true;
    void startConsultationSessionAction({ sessionId });
  }, [ended, sessionId]);

  if (ended) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 text-center">
        <div>
          <p className="font-medium">This consultation has ended</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The video room is closed. Open the appointment for notes or follow-up.
          </p>
        </div>
      </div>
    );
  }

  const src = buildJitsiEmbedUrl(roomName, displayName);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-black">
      <iframe
        title="Video consultation"
        src={src}
        className="aspect-video h-[min(70vh,640px)] w-full"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        allowFullScreen
      />
    </div>
  );
}
