import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";
import { isValidTeamSaveRequest, type TeamDraftPayload } from "../team-draft-validation";

const saveTeamDraft = createServerOnlyFn(async (request: {
  teamId: string | null;
  expectedUpdatedAt: string | null;
  payload: TeamDraftPayload;
}) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  const { data, error } = await supabase.rpc("team_editorial_command", {
    p_action: "save_draft",
    p_team_id: request.teamId,
    p_expected_updated_at: request.expectedUpdatedAt,
    p_payload: request.payload as unknown as import("../supabase/database.types").Json,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false as const, code: "internal" as const };
  }

  const result = data as Record<string, unknown>;
  if (result.ok === true && typeof result.teamId === "string" && typeof result.updatedAt === "string") {
    return { ok: true as const, teamId: result.teamId, updatedAt: result.updatedAt };
  }
  const allowedCodes = ["forbidden", "invalid_action", "invalid_payload", "invalid_roster", "invalid_staff", "duplicate_jersey", "season_not_found", "slug_taken", "not_editable", "conflict", "unauthenticated"];
  const code = typeof result.code === "string" && allowedCodes.includes(result.code)
    ? result.code as typeof allowedCodes[number]
    : "internal";
  return { ok: false as const, code };
});

export const saveTeamDraftFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isValidTeamSaveRequest(data)) return { ok: false as const, code: "invalid" as const };
    return saveTeamDraft(data);
  });


const readTeamDraft = createServerOnlyFn(async (teamId: string) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role)) {
    return { ok: false as const, code: "forbidden" as const };
  }
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, slug, category, season_id, description, logo_asset_id, updated_at, editorial_status")
    .eq("id", teamId)
    .eq("is_published", false)
    .maybeSingle();
  if (teamError || !team) return { ok: false as const, code: "not-found" as const };

  const [seasonResult, rosterResult, staffResult] = await Promise.all([
    team.season_id
      ? supabase.from("seasons").select("label").eq("id", team.season_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("team_members")
      .select("id, name, jersey_number, position, photo_asset_id")
      .eq("team_id", team.id).order("display_order", { ascending: true }),
    supabase.from("team_staff")
      .select("id, name, role_label, photo_asset_id")
      .eq("team_id", team.id).order("display_order", { ascending: true }),
  ]);
  if (seasonResult.error || rosterResult.error || staffResult.error) {
    return { ok: false as const, code: "internal" as const };
  }
  const hasMedia = Boolean(team.logo_asset_id)
    || (rosterResult.data ?? []).some((player) => Boolean(player.photo_asset_id))
    || (staffResult.data ?? []).some((member) => Boolean(member.photo_asset_id));

  return {
    ok: true as const,
    teamId: team.id,
    updatedAt: team.updated_at,
    editorialStatus: team.editorial_status,
    hasMedia,
    payload: {
      name: team.name,
      slug: team.slug,
      category: team.category as "senior" | "youth",
      seasonLabel: seasonResult.data?.label ?? "",
      description: team.description ?? "",
      roster: (rosterResult.data ?? []).map((player) => ({
        name: player.name,
        jerseyNumber: player.jersey_number,
        role: player.position ?? "",
      })),
      staff: (staffResult.data ?? []).map((member) => ({
        name: member.name,
        role: member.role_label,
      })),
    },
  };
});

export const getTeamDraftFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false as const, code: "invalid" as const };
    }
    const input = data as Record<string, unknown>;
    if (Object.keys(input).length !== 1 || typeof input.teamId !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.teamId)) {
      return { ok: false as const, code: "invalid" as const };
    }
    return readTeamDraft(input.teamId);
  });
