import { describe, expect, it } from "vitest";
import {
  defaultOrganizationSettings,
  parseOrganizationSettings,
} from "@/lib/organizations/settings";

describe("parseOrganizationSettings", () => {
  it("falls back to defaults for invalid/missing JSONB content", () => {
    expect(parseOrganizationSettings(null)).toEqual(defaultOrganizationSettings);
    expect(parseOrganizationSettings(undefined)).toEqual(defaultOrganizationSettings);
    expect(parseOrganizationSettings("not an object")).toEqual(defaultOrganizationSettings);
    expect(parseOrganizationSettings({ defaultLoanDurationDays: "abc" })).toEqual(
      defaultOrganizationSettings,
    );
  });

  it("keeps valid overrides", () => {
    const result = parseOrganizationSettings({
      allowPublicLoanRequests: false,
      defaultLoanDurationDays: 7,
    });
    expect(result.allowPublicLoanRequests).toBe(false);
    expect(result.defaultLoanDurationDays).toBe(7);
    expect(result.requireApprovalForLoanRequests).toBe(true);
  });
});
