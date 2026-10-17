import { describe, expect, it } from "vitest";
import { permissions } from "@/lib/permissions";
import { defaultOrganizationSettings } from "@/lib/organizations/settings";

describe("permissions", () => {
  it("only the owner can manage the organization", () => {
    expect(permissions.manageOrganization("owner")).toBe(true);
    expect(permissions.manageOrganization("admin")).toBe(false);
    expect(permissions.manageOrganization("manager")).toBe(false);
  });

  it("owner and admin can manage assets, manager cannot", () => {
    expect(permissions.manageAssets("owner")).toBe(true);
    expect(permissions.manageAssets("admin")).toBe(true);
    expect(permissions.manageAssets("manager")).toBe(false);
  });

  it("every role can record loans and view history", () => {
    for (const role of ["owner", "admin", "manager"] as const) {
      expect(permissions.recordLoans(role)).toBe(true);
      expect(permissions.viewHistory(role)).toBe(true);
    }
  });

  it("admins can manage members only when the org setting explicitly grants it", () => {
    expect(
      permissions.manageMembers("admin", { ...defaultOrganizationSettings, adminsCanManageMembers: false }),
    ).toBe(false);
    expect(
      permissions.manageMembers("admin", { ...defaultOrganizationSettings, adminsCanManageMembers: true }),
    ).toBe(true);
    expect(
      permissions.manageMembers("owner", { ...defaultOrganizationSettings, adminsCanManageMembers: false }),
    ).toBe(true);
    expect(
      permissions.manageMembers("manager", { ...defaultOrganizationSettings, adminsCanManageMembers: true }),
    ).toBe(false);
  });

  it("managers can process loan requests only when the org setting explicitly grants it", () => {
    expect(
      permissions.processLoanRequests("manager", {
        ...defaultOrganizationSettings,
        managersCanProcessRequests: false,
      }),
    ).toBe(false);
    expect(
      permissions.processLoanRequests("manager", {
        ...defaultOrganizationSettings,
        managersCanProcessRequests: true,
      }),
    ).toBe(true);
    expect(permissions.processLoanRequests("admin", defaultOrganizationSettings)).toBe(true);
  });

  it("only owner and admin can export data", () => {
    expect(permissions.exportData("owner")).toBe(true);
    expect(permissions.exportData("admin")).toBe(true);
    expect(permissions.exportData("manager")).toBe(false);
  });
});
