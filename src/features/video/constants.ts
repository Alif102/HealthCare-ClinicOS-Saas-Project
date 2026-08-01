export const VIDEO_SESSION_STATUS = {
  READY: "READY",
  LIVE: "LIVE",
  ENDED: "ENDED",
} as const;

export type VideoSessionStatus =
  (typeof VIDEO_SESSION_STATUS)[keyof typeof VIDEO_SESSION_STATUS];

export const VIDEO_SESSION_STATUS_LABEL: Record<VideoSessionStatus, string> = {
  READY: "Ready",
  LIVE: "In progress",
  ENDED: "Ended",
};

export function resolveVideoSessionStatus(session: {
  startedAt: Date | null;
  endedAt: Date | null;
}): VideoSessionStatus {
  if (session.endedAt) return "ENDED";
  if (session.startedAt) return "LIVE";
  return "READY";
}

/** Appointment statuses that may still open a video room. */
export const VIDEO_ELIGIBLE_APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
