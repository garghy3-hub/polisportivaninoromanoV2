import { describe, expect, it } from "vitest";
import type { Tables } from "./supabase/database.types";
import { mapPublishedTeams } from "./teams-public-read";

const team = (overrides: Partial<Tables<"teams">> = {}): Tables<"teams"> => ({
  id: "team-1", name: "Prima squadra", slug: "prima-squadra", category: "senior",
  season_id: "season-1", description: null, logo_asset_id: null, editorial_status: "published", is_published: true,
  display_order: 0, created_at: "", updated_at: "", created_by: null, updated_by: null,
  ...overrides,
});

describe("mapPublishedTeams", () => {
  it("includes only published teams from published seasons", () => {
    const result = mapPublishedTeams({
      teams: [team(), team({ id: "team-draft", slug: "draft", is_published: false }), team({ id: "team-old", slug: "old", season_id: "season-hidden" })],
      seasons: [{ id: "season-1", label: "2026/27" }],
      members: [], staff: [], media: [],
    }, (bucket, key) => `/${bucket}/${key}`);
    expect(result.map((item) => item.id)).toEqual(["team-1"]);
    expect(result[0]?.season).toBe("2026/27");
  });

  it("maps only published roster and staff entries, with public media", () => {
    const result = mapPublishedTeams({
      teams: [team({ logo_asset_id: "logo" })],
      seasons: [{ id: "season-1", label: "2026/27" }],
      members: [
        { id: "player-1", team_id: "team-1", name: "Atleta", jersey_number: 7, position: "Schiacciatrice", biography: null, photo_asset_id: "photo", is_published: true, display_order: 1 },
        { id: "player-draft", team_id: "team-1", name: "Bozza", jersey_number: null, position: null, biography: null, photo_asset_id: null, is_published: false, display_order: 0 },
      ],
      staff: [
        { id: "staff-1", team_id: "team-1", name: "Tecnico", role_label: "Allenatore", biography: null, photo_asset_id: null, is_published: true, display_order: 0 },
      ],
      media: [
        { id: "logo", bucket_id: "nrm-media", storage_key: "logo.webp", alt_text: "Logo squadra", is_public: true },
        { id: "photo", bucket_id: "nrm-media", storage_key: "player.webp", alt_text: "Ritratto atleta", is_public: true },
      ],
    }, (bucket, key) => `/${bucket}/${key}`);
    expect(result[0]?.logoUrl).toBe("/nrm-media/logo.webp");
    expect(result[0]?.roster).toHaveLength(1);
    expect(result[0]?.roster?.[0]?.photoAlt).toBe("Ritratto atleta");
    expect(result[0]?.staff?.[0]?.role).toBe("Allenatore");
  });

  it("does not expose media that is not marked public", () => {
    const result = mapPublishedTeams({
      teams: [team({ logo_asset_id: "private-logo" })],
      seasons: [{ id: "season-1", label: "2026/27" }],
      members: [], staff: [],
      media: [{ id: "private-logo", bucket_id: "nrm-media", storage_key: "private.webp", alt_text: "Privato", is_public: false }],
    }, (bucket, key) => `/${bucket}/${key}`);
    expect(result[0]?.logoUrl).toBeUndefined();
  });
});
