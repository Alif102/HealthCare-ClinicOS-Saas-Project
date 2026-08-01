/** Public Jitsi Meet host — no API key required for ThemeForest demos. */
export const JITSI_MEET_HOST = "https://meet.jit.si";

export function buildJitsiJoinUrl(roomName: string) {
  return `${JITSI_MEET_HOST}/${encodeURIComponent(roomName)}`;
}

export function buildJitsiEmbedUrl(roomName: string, displayName?: string) {
  const url = new URL(buildJitsiJoinUrl(roomName));
  // Minimal chrome for in-app embed
  url.searchParams.set("config.prejoinConfig.enabled", "true");
  url.searchParams.set("config.disableDeepLinking", "true");
  if (displayName) {
    url.searchParams.set("userInfo.displayName", displayName);
  }
  return url.toString();
}

/** Opaque room id — never put patient names or MRNs in room names. */
export function createRoomName() {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `clinicos-${id.slice(0, 20)}`;
}
