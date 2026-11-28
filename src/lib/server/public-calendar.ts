import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import type { MatchEvent } from "../content-types";
import { getSupabaseServerClient } from "../supabase/server";

const readPublishedCalendar = createServerOnlyFn(async () => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { configured: false as const, events: [] as MatchEvent[] };
  const { data, error } = await supabase.from("events")
    .select("id, starts_at, home_team, away_team, event_type, round_label, venue, competition, status, home_score, away_score, notes, display_order")
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .limit(250);
  if (error || !data) return { configured: true as const, events: [] as MatchEvent[] };

  const events: MatchEvent[] = data.map((row) => {
    const homeScore = row.home_score ?? undefined;
    const awayScore = row.away_score ?? undefined;
    const outcome = row.status === "completed" && homeScore !== undefined && awayScore !== undefined
      ? homeScore > awayScore ? "win" : homeScore < awayScore ? "loss" : "draw"
      : undefined;
    const type = row.event_type === "match" ? "Partite"
      : row.event_type === "training" ? "Allenamenti"
      : row.event_type === "club-event" ? "Attività societarie" : "Eventi";
    return {
      id: row.id,
      dateTime: row.starts_at,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      type,
      ...(row.round_label ? { round: row.round_label } : {}),
      ...(row.venue ? { venue: row.venue } : {}),
      ...(row.competition ? { competition: row.competition } : {}),
      status: row.status as MatchEvent["status"],
      ...(homeScore !== undefined ? { homeScore } : {}),
      ...(awayScore !== undefined ? { awayScore } : {}),
      ...(outcome ? { outcome } : {}),
      ...(row.notes ? { notes: row.notes } : {}),
      visible: true,
      order: row.display_order,
    };
  });
  return { configured: true as const, events };
});

export const publicCalendarFn = createServerFn({ method: "GET" }).handler(
  async () => readPublishedCalendar(),
);
