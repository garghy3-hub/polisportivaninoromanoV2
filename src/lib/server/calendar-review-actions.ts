import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

const readCalendarReviewQueue = createServerOnlyFn(async () => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["publisher", "administrator"].includes(actor.role))
    return { ok: false as const, code: "forbidden" as const };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };
  const { data, error } = await supabase.from("events")
    .select("id, starts_at, home_team, away_team, event_type, round_label, season_id, competition, venue, status, home_score, away_score, editorial_status, review_note, submitted_at, updated_at, is_published")
    .in("editorial_status", ["in-review", "approved", "published"])
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error || !data) return { ok: false as const, code: "internal" as const };
  return { ok: true as const, items: data };
});

export const calendarReviewQueueFn = createServerFn({ method: "GET" }).handler(
  async () => readCalendarReviewQueue(),
);
