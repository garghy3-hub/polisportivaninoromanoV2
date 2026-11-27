import { describe, expect, it } from "vitest";
import { isValidTeamWorkflowRequest } from "../src/lib/server/team-workflow-actions";

const base = {
  action: "submit",
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  expectedUpdatedAt: "2026-11-27T10:30:00.123Z",
};

describe("team workflow request validation", () => {
  it("accepts a strict ISO timestamp with an explicit timezone", () => {
    expect(isValidTeamWorkflowRequest(base)).toBe(true);
    expect(isValidTeamWorkflowRequest({
      ...base,
      expectedUpdatedAt: "2024-02-29T10:30:00+01:00",
    })).toBe(true);
  });

  it("rejects loose, timezone-less, and impossible timestamps", () => {
    for (const expectedUpdatedAt of [
      "November 27, 2026",
      "2026-11-27",
      "2026-11-27T10:30:00",
      "2026-02-31T10:30:00Z",
      "2026-11-27T25:30:00Z",
      "2026-11-27T10:60:00Z",
      "2026-11-27T10:30:00+99:00",
      "2026-11-27T10:30:00+01:99",
    ]) {
      expect(isValidTeamWorkflowRequest({ ...base, expectedUpdatedAt })).toBe(false);
    }
  });

  it("requires a rejection note and rejects unexpected payload keys", () => {
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...base, action: "reject", note: "Motivazione" })).toBe(true);
    expect(isValidTeamWorkflowRequest({ ...base, extra: true })).toBe(false);
  });
});
