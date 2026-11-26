import { describe, expect, it } from "vitest";
import {
  canManageEditorialRoles,
  canTransitionRevision,
  getEditorialPermissions,
  hasEditorialPermission,
} from "../src/lib/editorial-permissions";

describe("editorial permission policy", () => {
  it("denies reader access and rejects unknown role/permission values", () => {
    expect(getEditorialPermissions("reader")).toEqual([]);
    expect(hasEditorialPermission("reader", "edit-content")).toBe(false);
    expect(hasEditorialPermission("unexpected-role", "publish-content")).toBe(false);
    expect(hasEditorialPermission("administrator", "unexpected-permission")).toBe(false);
    expect(hasEditorialPermission(null, "edit-content")).toBe(false);
  });

  it("grants editors only authoring and media permissions", () => {
    expect(hasEditorialPermission("editor", "create-content")).toBe(true);
    expect(hasEditorialPermission("editor", "edit-content")).toBe(true);
    expect(hasEditorialPermission("editor", "submit-for-review")).toBe(true);
    expect(hasEditorialPermission("editor", "manage-media")).toBe(true);
    expect(hasEditorialPermission("editor", "publish-content")).toBe(false);
    expect(hasEditorialPermission("editor", "manage-user-roles")).toBe(false);
  });

  it("limits review and publication actions to publishers and administrators", () => {
    for (const role of ["publisher", "administrator"]) {
      expect(hasEditorialPermission(role, "approve-content")).toBe(true);
      expect(hasEditorialPermission(role, "publish-content")).toBe(true);
      expect(hasEditorialPermission(role, "read-audit-log")).toBe(true);
    }
    expect(hasEditorialPermission("publisher", "manage-site-settings")).toBe(false);
    expect(hasEditorialPermission("publisher", "manage-user-roles")).toBe(false);
    expect(hasEditorialPermission("administrator", "manage-user-roles")).toBe(true);
    expect(canManageEditorialRoles("administrator")).toBe(true);
    expect(canManageEditorialRoles("publisher")).toBe(false);
    expect(canManageEditorialRoles("unknown")).toBe(false);
  });

  it("allows only explicitly authorized revision transitions", () => {
    expect(canTransitionRevision("editor", "draft", "in-review")).toBe(true);
    expect(canTransitionRevision("publisher", "in-review", "approved")).toBe(true);
    expect(canTransitionRevision("publisher", "in-review", "rejected")).toBe(true);
    expect(canTransitionRevision("editor", "rejected", "draft")).toBe(true);
    expect(canTransitionRevision("publisher", "approved", "published")).toBe(true);
    expect(canTransitionRevision("publisher", "published", "draft")).toBe(true);
    expect(canTransitionRevision("publisher", "published", "archived")).toBe(true);
    expect(canTransitionRevision("publisher", "archived", "draft")).toBe(true);
  });

  it("denies unauthorized, same-state and unsupported transitions", () => {
    expect(canTransitionRevision("reader", "draft", "in-review")).toBe(false);
    expect(canTransitionRevision("editor", "in-review", "approved")).toBe(false);
    expect(canTransitionRevision("editor", "draft", "published")).toBe(false);
    expect(canTransitionRevision("publisher", "draft", "draft")).toBe(false);
    expect(canTransitionRevision("publisher", "archived", "published")).toBe(false);
  });
});
