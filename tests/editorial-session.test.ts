import { describe, expect, it } from "vitest";
import {
  actorHasEditorialPermission,
  resolveEditorialActor,
  type EditorialSessionRecord,
} from "../src/lib/editorial-session";

const now = Date.parse("2026-11-26T20:00:00.000Z");

const activeSession: EditorialSessionRecord = {
  id: "session-123",
  actorId: "user-456",
  role: "editor",
  expiresAt: "2026-11-26T21:00:00.000Z",
  revokedAt: null,
};

describe("editorial server session boundary", () => {
  it("resolves an active session record into a minimal actor", () => {
    expect(resolveEditorialActor(activeSession, now)).toEqual({
      sessionId: "session-123",
      id: "user-456",
      role: "editor",
    });
  });

  it("rejects missing, malformed and expired session records", () => {
    expect(resolveEditorialActor(null, now)).toBeNull();
    expect(resolveEditorialActor(undefined, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, id: " " }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, id: "x".repeat(129) }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, actorId: "x".repeat(129) }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, unexpected: true }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, actorId: "" }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, expiresAt: "not-a-date" }, now)).toBeNull();
    expect(resolveEditorialActor({ ...activeSession, expiresAt: "2026-11-26T20:00:00.000Z" }, now)).toBeNull();
  });

  it("rejects revoked sessions and unknown roles", () => {
    expect(resolveEditorialActor({
      ...activeSession,
      revokedAt: "2026-11-26T19:00:00.000Z",
    }, now)).toBeNull();
    expect(resolveEditorialActor({
      ...activeSession,
      role: "superuser",
    }, now)).toBeNull();
  });

  it("fails closed for missing actors, unknown permissions and insufficient roles", () => {
    const editor = resolveEditorialActor(activeSession, now);
    expect(actorHasEditorialPermission(editor, "edit-content")).toBe(true);
    expect(actorHasEditorialPermission(editor, "publish-content")).toBe(false);
    expect(actorHasEditorialPermission(editor, "not-a-permission")).toBe(false);
    expect(actorHasEditorialPermission(null, "edit-content")).toBe(false);
  });

  it("rejects invalid clock values", () => {
    expect(resolveEditorialActor(activeSession, Number.NaN)).toBeNull();
    expect(resolveEditorialActor(activeSession, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
