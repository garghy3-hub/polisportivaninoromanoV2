import type {
  EditorialRole,
  RevisionStatus,
} from "./content-types";

/**
 * Application-level permission policy for the future editorial adapter.
 *
 * This module is deliberately side-effect free. It is not authentication:
 * callers must supply a role loaded from a verified server-side session,
 * and every mutation must enforce the same policy on the server.
 */
export type EditorialPermission =
  | "create-content"
  | "edit-content"
  | "submit-for-review"
  | "review-content"
  | "approve-content"
  | "reject-content"
  | "publish-content"
  | "unpublish-content"
  | "archive-content"
  | "restore-content"
  | "delete-content"
  | "manage-media"
  | "manage-site-settings"
  | "manage-user-roles"
  | "read-audit-log";

const editorPermissions: readonly EditorialPermission[] = [
  "create-content",
  "edit-content",
  "submit-for-review",
  "manage-media",
];

const publisherPermissions: readonly EditorialPermission[] = [
  ...editorPermissions,
  "review-content",
  "approve-content",
  "reject-content",
  "publish-content",
  "unpublish-content",
  "archive-content",
  "restore-content",
  "read-audit-log",
];

const administratorPermissions: readonly EditorialPermission[] = [
  ...publisherPermissions,
  "delete-content",
  "manage-site-settings",
  "manage-user-roles",
];

const permissionMap: Record<EditorialRole, readonly EditorialPermission[]> = {
  reader: [],
  editor: editorPermissions,
  publisher: publisherPermissions,
  administrator: administratorPermissions,
};

/** Unknown roles and permissions fail closed. */
export function hasEditorialPermission(
  role: unknown,
  permission: unknown,
): boolean {
  if (
    typeof role !== "string" ||
    !Object.prototype.hasOwnProperty.call(permissionMap, role) ||
    typeof permission !== "string"
  ) {
    return false;
  }

  return permissionMap[role as EditorialRole].includes(
    permission as EditorialPermission,
  );
}

const transitionPermission: Partial<
  Record<RevisionStatus, Partial<Record<RevisionStatus, EditorialPermission>>>
> = {
  draft: { "in-review": "submit-for-review" },
  "in-review": {
    approved: "approve-content",
    rejected: "reject-content",
  },
  rejected: { draft: "edit-content" },
  approved: { published: "publish-content" },
  published: {
    draft: "unpublish-content",
    archived: "archive-content",
  },
  archived: { draft: "restore-content" },
};

/** Only explicitly listed editorial state transitions are allowed. */
export function canTransitionRevision(
  role: unknown,
  current: RevisionStatus,
  next: RevisionStatus,
): boolean {
  if (current === next) return false;
  const permission = transitionPermission[current]?.[next];
  return permission !== undefined && hasEditorialPermission(role, permission);
}

/** Role assignment is an administrator-only operation. */
export function canManageEditorialRoles(role: unknown): boolean {
  return hasEditorialPermission(role, "manage-user-roles");
}

/** Stable permission list for building an admin permissions screen. */
export function getEditorialPermissions(
  role: EditorialRole,
): readonly EditorialPermission[] {
  return permissionMap[role];
}
