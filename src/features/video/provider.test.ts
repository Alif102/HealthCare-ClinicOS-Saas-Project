import { describe, expect, it } from "vitest";

import {
  resolveVideoSessionStatus,
  VIDEO_SESSION_STATUS,
} from "@/features/video/constants";
import {
  buildJitsiEmbedUrl,
  buildJitsiJoinUrl,
  createRoomName,
  JITSI_MEET_HOST,
} from "@/features/video/provider";

describe("resolveVideoSessionStatus", () => {
  it("maps timestamps to READY / LIVE / ENDED", () => {
    expect(
      resolveVideoSessionStatus({ startedAt: null, endedAt: null }),
    ).toBe(VIDEO_SESSION_STATUS.READY);
    expect(
      resolveVideoSessionStatus({
        startedAt: new Date("2026-01-01"),
        endedAt: null,
      }),
    ).toBe(VIDEO_SESSION_STATUS.LIVE);
    expect(
      resolveVideoSessionStatus({
        startedAt: new Date("2026-01-01"),
        endedAt: new Date("2026-01-02"),
      }),
    ).toBe(VIDEO_SESSION_STATUS.ENDED);
  });
});

describe("jitsi urls", () => {
  it("builds join and embed urls", () => {
    const room = "clinicos-abc123";
    expect(buildJitsiJoinUrl(room)).toBe(`${JITSI_MEET_HOST}/${room}`);

    const embed = buildJitsiEmbedUrl(room, "Dr. Ada");
    expect(embed).toContain(room);
    expect(embed).toContain("userInfo.displayName=Dr.+Ada");
    expect(embed).toContain("config.prejoinConfig.enabled=true");
  });

  it("creates opaque room names without PHI", () => {
    const name = createRoomName();
    expect(name.startsWith("clinicos-")).toBe(true);
    expect(name).not.toMatch(/patient|mrn|john/i);
  });
});
