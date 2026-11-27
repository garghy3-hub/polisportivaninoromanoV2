import type { EditorialRole } from "./content-types";
import {
  hasEditorialPermission,
  type EditorialPermission,
} from "./editorial-permissions";

const editorialRoles: readonly EditorialRole[] = [
  "reader",
  "editor",
  "publisher",
  "administrator",
];

/**
 * Session data returned by a future trusted, server-side session adapter.
 * Never construct this object from request-body, query-string or browser state.
 */
export interface EditorialSessionRecord {
  id: string;
  actorId: string;
  role: EditorialRole;
  expiresAt: string;
  revokedAt?: string | null;
}

export interface EditorialActor {
  sessionId: string;
  id: string;
  role: EditorialRole;
}

/**
 * Resolve an active actor from a record already loaded and verified by the
 * server-side authentication adapter. This function does not verify cookies,
 * signatures, passwords, session storage or the authenticity of its input.
 */
export function resolveEditorialActor(
  session: unknown,
  now = Date.now(),
): EditorialActor | null {
  if (
    typeof session !== "object" ||
    session === null ||
    !Number.isFinite(now)
  ) {
    return null;
  }

  const candidate = session as Record<string, unknown>;
  const allowedKeys = ["id", "actorId", "role", "expiresAt", "revokedAt"];
  const actualKeys = Object.keys(candidate);
  if (actualKeys.some(key => !allowedKeys.includes(key))) return null;
  const id = candidate.id;
  const actorId = candidate.actorId;
  const role = candidate.role;
  const expiresAt = candidate.expiresAt;
  const revokedAt = candidate.revokedAt;

  if (
    typeof id !== "string" ||
    id.trim().length === 0 ||
    typeof actorId !== "string" ||
    actorId.trim().length === 0 ||
    typeof role !== "string" ||
    !editorialRoles.includes(role as EditorialRole) ||
    typeof expiresAt !== "string" ||
    expiresAt.trim().length === 0 ||
    (revokedAt !== undefined && revokedAt !== null)
  ) {
    return null;
  }

  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= now) return null;

  return {
    sessionId: id.trim(),
    id: actorId.trim(),
    role: role as EditorialRole,
  };
}

/** Fail-closed permission check for an actor resolved on the server. */
export function actorHasEditorialPermission(
  actor: EditorialActor | null,
  permission: unknown,
): permission is EditorialPermission {
  if (actor === null) return false;
  return hasEditorialPermission(actor.role, permission);
}
