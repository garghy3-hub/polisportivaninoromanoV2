import { describe, expect, it } from "vitest";
import { isValidTeamWorkflowRequest } from "./team-workflow-actions";

const base = {
  action: "submit",
  teamId: "123e4567-e89b-12d3-a456-426614174000",
  expectedUpdatedAt: "2026-11-27T21:00:00.000Z",
};

describe("team workflow request validation", () => {
  it("accepts valid submit and transition requests", () => {
    expect(isValidTeamWorkflowRequest(base)).toBe(true);
    expect(isValidTeamWorkflowRequest({ ...base, action: "approve" })).toBe(true);
    expect(isValidTeamWorkflowRequest({ ...base, action: "publish" })).toBe(true);
    expect(isValidTeamWorkflowRequest({ ...base, action: "unpublish" })).toBe(true);
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject", note: "Dati da integrare" })).toBe(true);
  });
  it("requires a note only for rejection and rejects extra keys", () => {
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject", note: " " })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject", note: "x".repeat(1001) })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, note: "unrequested" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, unexpected: true })).toBe(false);
  });
  it("rejects malformed identifiers, dates and unsupported actions", () => {
    expect(isValidTeamWorkflowRequest({ ...base, teamId: "not-a-uuid" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, expectedUpdatedAt: "invalid" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, action: "delete" })).toBe(false);
    expect(isValidTeamWorkflowRequest(null)).toBe(false);
  });
});
