import type { Prisma } from "@prisma/client";

export type TenantSettings = {
  /** When false, doctor AI assist actions are blocked. Default: true. */
  aiAssistEnabled?: boolean;
};

export function parseTenantSettings(value: unknown): TenantSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    aiAssistEnabled:
      typeof record.aiAssistEnabled === "boolean"
        ? record.aiAssistEnabled
        : undefined,
  };
}

export function isAiAssistEnabled(settings: unknown): boolean {
  const parsed = parseTenantSettings(settings);
  return parsed.aiAssistEnabled !== false;
}

export function mergeTenantSettings(
  current: unknown,
  patch: TenantSettings,
): Prisma.InputJsonValue {
  return {
    ...parseTenantSettings(current),
    ...patch,
  };
}
