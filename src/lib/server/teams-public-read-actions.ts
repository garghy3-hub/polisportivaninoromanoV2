import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "../supabase/server";
import { mapPublishedTeams } from "../teams-public-read";

const readPublishedTeams = createServerOnlyFn(async () => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  try {
    // Explicit publication filters remain in place even for an authenticated
    // administrator session, whose RLS policy can otherwise read draft rows.
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, slug, category, description, season_id, logo_asset_id, is_published, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (teamsError) throw teamsError;
    if (!teams?.length) return { ok: true as const, value: [] };

    const teamIds = teams.map((team) => team.id);
    const seasonIds = [...new Set(teams.map((team) => team.season_id).filter((id): id is string => Boolean(id)))];
    const [seasonsResult, membersResult, staffResult] = await Promise.all([
      seasonIds.length
        ? supabase.from("seasons").select("id, label").in("id", seasonIds).eq("is_published", true)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("team_members")
        .select("id, team_id, name, jersey_number, position, biography, photo_asset_id, is_published, display_order")
        .in("team_id", teamIds).eq("is_published", true).order("display_order", { ascending: true }),
      supabase.from("team_staff")
        .select("id, team_id, name, role_label, biography, photo_asset_id, is_published, display_order")
        .in("team_id", teamIds).eq("is_published", true).order("display_order", { ascending: true }),
    ]);
    if (seasonsResult.error || membersResult.error || staffResult.error) throw new Error("teams_read_failed");

    const mediaIds = [...new Set([
      ...teams.map((team) => team.logo_asset_id),
      ...(membersResult.data ?? []).map((member) => member.photo_asset_id),
      ...(staffResult.data ?? []).map((member) => member.photo_asset_id),
    ].filter((id): id is string => Boolean(id)))];
    const mediaResult = mediaIds.length
      ? await supabase.from("media_assets")
          .select("id, bucket_id, storage_key, alt_text, is_public")
          .in("id", mediaIds).eq("is_public", true)
      : { data: [], error: null };
    if (mediaResult.error) throw new Error("teams_read_failed");

    const value = mapPublishedTeams({
      teams,
      seasons: seasonsResult.data ?? [],
      members: membersResult.data ?? [],
      staff: staffResult.data ?? [],
      media: mediaResult.data ?? [],
    }, (bucket, key) => supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl);

    return { ok: true as const, value };
  } catch {
    return { ok: false as const, code: "internal" as const };
  }
});

export const teamsPublicListFn = createServerFn({ method: "GET" }).handler(
  async () => readPublishedTeams(),
);
