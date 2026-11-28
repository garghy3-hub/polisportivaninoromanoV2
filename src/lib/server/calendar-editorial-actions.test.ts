import { describe, expect, it } from "vitest";
import { isValidDraftPayload, isValidWorkflowRequest } from "./calendar-editorial-actions";

const draft = {
  startsAt: "2026-11-28T18:30:00Z",
  homeTeam: "Nino Romano",
  awayTeam: "Volley Club",
  eventType: "match",
  roundLabel: "3ª giornata",
  seasonLabel: "2026/27",
  venue: "Milazzo",
  competition: "Serie C",
  status: "scheduled",
  homeScore: null,
  awayScore: null,
  notes: "",
};

const command = {
  action: "submit",
  eventId: "123e4567-e89b-12d3-a456-426614174000",
  expectedUpdatedAt: "2026-11-28T17:00:00.000Z",
  note: "",
};

describe("calendar editorial request validation", () => {
  it("accepts valid draft content", () => {
    expect(isValidDraftPayload(draft)).toBe(true);
    expect(isValidDraftPayload({ ...draft, startsAt: "0000-02-29T12:00:00Z" })).toBe(true);
    expect(isValidDraftPayload({ ...draft, status: "completed", homeScore: 3, awayScore: 1 })).toBe(true);
  });

  it("rejects malformed or inconsistent drafts", () => {
    expect(isValidDraftPayload({ ...draft, extra: true })).toBe(false);
    expect(isValidDraftPayload({ ...draft, startsAt: "2026-02-30T12:00:00Z" })).toBe(false);
    expect(isValidDraftPayload({ ...draft, startsAt: "2026-11-28T12:00:00+15:00" })).toBe(false);
    expect(isValidDraftPayload({ ...draft, homeTeam: " " })).toBe(false);
    expect(isValidDraftPayload({ ...draft, awayTeam: "Nino Romano" })).toBe(false);
    expect(isValidDraftPayload({ ...draft, status: "completed" })).toBe(false);
    expect(isValidDraftPayload({ ...draft, homeScore: 1 })).toBe(false);
    expect(isValidDraftPayload({ ...draft, homeScore: 1.5, awayScore: 2 })).toBe(false);
    expect(isValidDraftPayload({ ...draft, notes: "x".repeat(1001) })).toBe(false);
    expect(isValidDraftPayload(null)).toBe(false);
  });

  it("accepts valid workflow requests and requires a rejection note", () => {
    expect(isValidWorkflowRequest(command)).toBe(true);
    expect(isValidWorkflowRequest({ ...command, action: "reject", note: "Correggere dati" })).toBe(true);
    expect(isValidWorkflowRequest({ ...command, action: "approve" })).toBe(true);
  });

  it("rejects malformed workflow requests and unnecessary notes", () => {
    expect(isValidWorkflowRequest({ ...command, action: "reject" })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, action: "reject", note: " " })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, action: "publish", note: "unrequested" })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, eventId: "bad" })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, expectedUpdatedAt: "2026-02-31T12:00:00Z" })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, extra: "field" })).toBe(false);
    expect(isValidWorkflowRequest({ ...command, note: "x".repeat(1001) })).toBe(false);
    expect(isValidWorkflowRequest(null)).toBe(false);
  });
});
