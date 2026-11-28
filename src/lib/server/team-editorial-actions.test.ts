import { describe, expect, it } from "vitest";
import { isValidTeamDraftPayload, isValidTeamSaveRequest } from "../team-draft-validation";
import { isValidTeamWorkflowRequest } from "./team-workflow-actions";

const valid = {
  name: "Prima squadra",
  slug: "prima-squadra",
  category: "senior",
  seasonLabel: "2026/27",
  description: "Squadra senior",
  roster: [
    { name: "Atleta Uno", jerseyNumber: 7, role: "Schiacciatrice" },
    { name: "Atleta Due", jerseyNumber: null, role: "Palleggiatrice" },
  ],
  staff: [{ name: "Tecnico", role: "Allenatore" }],
};

describe("team draft payload validation", () => {
  it("accepts a complete aggregate draft", () => {
    expect(isValidTeamDraftPayload(valid)).toBe(true);
  });

  it("rejects unknown keys and unsafe slugs", () => {
    expect(isValidTeamDraftPayload({ ...valid, isPublished: true })).toBe(false);
    expect(isValidTeamDraftPayload({ ...valid, slug: "../squadra" })).toBe(false);
  });

  it("rejects duplicate or out-of-range jersey numbers", () => {
    expect(isValidTeamDraftPayload({
      ...valid,
      roster: [
        { name: "Atleta Uno", jerseyNumber: 7, role: "Schiacciatrice" },
        { name: "Atleta Due", jerseyNumber: 7, role: "Libero" },
      ],
    })).toBe(false);
    expect(isValidTeamDraftPayload({
      ...valid,
      roster: [{ name: "Atleta Uno", jerseyNumber: 100, role: "Schiacciatrice" }],
    })).toBe(false);
  });

  it("enforces aggregate limits and required staff fields", () => {
    expect(isValidTeamDraftPayload({ ...valid, roster: Array.from({ length: 101 }, () => valid.roster[0]) })).toBe(false);
    expect(isValidTeamDraftPayload({ ...valid, staff: [{ name: "Tecnico", role: "" }] })).toBe(false);
  });
});

 
describe("team save request timestamp validation", () => {
  const request = { teamId: "123e4567-e89b-12d3-a456-426614174000", expectedUpdatedAt: "2026-11-28T17:00:00.000Z", payload: valid };
  it("accepts a valid optimistic concurrency request", () => {
    expect(isValidTeamSaveRequest(request)).toBe(true);
  });
  it("rejects malformed, impossible and timezone-invalid timestamps", () => {
    expect(isValidTeamSaveRequest({ ...request, expectedUpdatedAt: "2026-02-31T12:00:00Z" })).toBe(false);
    expect(isValidTeamSaveRequest({ ...request, expectedUpdatedAt: "2026-11-28T12:00:00+15:00" })).toBe(false);
    expect(isValidTeamSaveRequest({ ...request, expectedUpdatedAt: "yesterday" })).toBe(false);
    expect(isValidTeamSaveRequest({ ...request, expectedUpdatedAt: null })).toBe(false);
  });
});


describe("team editorial workflow request validation", () => {
  const command = {
    action: "submit",
    teamId: "123e4567-e89b-12d3-a456-426614174000",
    expectedUpdatedAt: "2026-11-28T17:00:00.000Z",
  };

  it("accepts every supported action and requires a rejection note", () => {
    for (const action of ["submit", "approve", "publish", "unpublish"]) {
      expect(isValidTeamWorkflowRequest({ ...command, action })).toBe(true);
    }
    expect(isValidTeamWorkflowRequest({ ...command, action: "reject", note: "Correggere la rosa" })).toBe(true);
  });

  it("accepts valid year-zero leap-day timestamps and timezone offsets", () => {
    expect(isValidTeamWorkflowRequest({
      ...command,
      expectedUpdatedAt: "0000-02-29T12:00:00Z",
    })).toBe(true);
    expect(isValidTeamWorkflowRequest({
      ...command,
      expectedUpdatedAt: "2026-11-28T12:00:00+14:00",
    })).toBe(true);
  });

  it("rejects malformed identifiers, timestamps, notes and extra fields", () => {
    expect(isValidTeamWorkflowRequest({ ...command, teamId: "not-a-uuid" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, expectedUpdatedAt: "2026-02-31T12:00:00Z" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, expectedUpdatedAt: "2026-11-28T12:00:00+15:00" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, action: "reject" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, action: "reject", note: " " })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, action: "reject", note: "x".repeat(1001) })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, action: "delete" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, action: "submit", note: "unexpected" })).toBe(false);
    expect(isValidTeamWorkflowRequest({ ...command, unexpected: true })).toBe(false);
    expect(isValidTeamWorkflowRequest(null)).toBe(false);
  });
});
