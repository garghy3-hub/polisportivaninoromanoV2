import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

const readCalendarDraftLibrary = createServerOnlyFn(async () => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role))
    return { ok: false as const, code: "forbidden" as const };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };
  const { data, error } = await supabase.from("events")
    .select("id, starts_at, home_team, away_team, event_type, round_label, season_id, competition, venue, status, home_score, away_score, notes, updated_at, editorial_status")
    .eq("is_published", false)
    .in("editorial_status", ["draft", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error || !data) return { ok: false as const, code: "internal" as const };

  const seasonIds = [...new Set(data.flatMap(row => row.season_id ? [row.season_id] : []))];
  const seasonLabels = new Map<string, string>();
  if (seasonIds.length) {
    const { data: seasons, error: seasonError } = await supabase.from("seasons")
      .select("id, label").in("id", seasonIds);
    if (seasonError || !seasons) return { ok: false as const, code: "internal" as const };
    for (const season of seasons) seasonLabels.set(season.id, season.label);
  }
  return {
    ok: true as const,
    items: data.map(row => ({
      id: row.id,
      startsAt: row.starts_at,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      eventType: row.event_type,
      roundLabel: row.round_label ?? "",
      seasonLabel: row.season_id ? seasonLabels.get(row.season_id) ?? "" : "",
      competition: row.competition ?? "",
      venue: row.venue ?? "",
      status: row.status,
      homeScore: row.home_score,
      awayScore: row.away_score,
      notes: row.notes ?? "",
      updatedAt: row.updated_at,
      editorialStatus: row.editorial_status,
    })),
  };
});

export const calendarDraftLibraryFn = createServerFn({ method: "GET" }).handler(
  async () => readCalendarDraftLibrary(),
);
