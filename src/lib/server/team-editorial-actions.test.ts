import { describe, expect, it } from "vitest";
import { isValidTeamDraftPayload } from "../team-draft-validation";

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
