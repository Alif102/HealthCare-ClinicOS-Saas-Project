import { describe, expect, it } from "vitest";

import {
  isAiAssistEnabled,
  mergeTenantSettings,
  parseTenantSettings,
} from "@/features/admin/settings";

describe("parseTenantSettings", () => {
  it("returns empty object for non-objects", () => {
    expect(parseTenantSettings(null)).toEqual({});
    expect(parseTenantSettings([])).toEqual({});
    expect(parseTenantSettings("x")).toEqual({});
  });

  it("keeps only boolean aiAssistEnabled", () => {
    expect(parseTenantSettings({ aiAssistEnabled: false, extra: 1 })).toEqual({
      aiAssistEnabled: false,
    });
    expect(parseTenantSettings({ aiAssistEnabled: "no" })).toEqual({
      aiAssistEnabled: undefined,
    });
  });
});

describe("isAiAssistEnabled", () => {
  it("defaults to enabled when unset", () => {
    expect(isAiAssistEnabled(undefined)).toBe(true);
    expect(isAiAssistEnabled({})).toBe(true);
  });

  it("respects explicit false", () => {
    expect(isAiAssistEnabled({ aiAssistEnabled: false })).toBe(false);
  });
});

describe("mergeTenantSettings", () => {
  it("patches without dropping known keys", () => {
    expect(
      mergeTenantSettings({ aiAssistEnabled: true }, { aiAssistEnabled: false }),
    ).toEqual({ aiAssistEnabled: false });
  });
});
