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
