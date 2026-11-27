import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";
import { mapNewsRevisionRecord } from "./supabase-news-editorial-repository";

const loadNewsReviewQueue = createServerOnlyFn(async () => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (actor.role !== "publisher" && actor.role !== "administrator") {
    return { ok: false as const, code: "forbidden" as const };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "internal" as const };

  const { data, error } = await supabase
    .from("news_revisions")
    .select("*")
    .in("status", ["in-review", "approved"])
    .order("submitted_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !data) return { ok: false as const, code: "internal" as const };

  const items = data.map((row) => mapNewsRevisionRecord({ revision: row, version: row.version }));
  if (items.some((item) => item === null)) {
    return { ok: false as const, code: "internal" as const };
  }

  return { ok: true as const, items: items.filter((item) => item !== null) };
});

export const newsReviewQueueFn = createServerFn({ method: "GET" }).handler(
  async () => loadNewsReviewQueue(),
);
