"use client";

import dynamic from "next/dynamic";

const VideoRoom = dynamic(
  () =>
    import("@/features/video/components/video-room").then((mod) => mod.VideoRoom),
  {
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 text-center text-sm text-muted-foreground">
        Loading video room…
      </div>
    ),
    ssr: false,
  },
);

type VideoRoomLazyProps = {
  sessionId: string;
  roomName: string;
  displayName: string;
  ended: boolean;
};

export function VideoRoomLazy(props: VideoRoomLazyProps) {
  return <VideoRoom {...props} />;
}
