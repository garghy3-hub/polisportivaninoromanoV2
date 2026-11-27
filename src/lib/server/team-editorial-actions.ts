import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

export interface TeamDraftPayload {
  name: string;
  slug: string;
  category: "senior" | "youth";
  seasonLabel: string;
  description: string;
  roster: Array<{ name: string; jerseyNumber: number | null; role: string }>;
  staff: Array<{ name: string; role: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidTeamDraftPayload(value: unknown): value is TeamDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input).sort();
  if (keys.join(",") !== "category,description,name,roster,seasonLabel,slug,staff") return false;
  if (
    typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 120 ||
    typeof input.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 120 ||
    (input.category !== "senior" && input.category !== "youth") ||
    typeof input.seasonLabel !== "string" || input.seasonLabel.length > 40 ||
    typeof input.description !== "string" || input.description.length > 1200 ||
    !Array.isArray(input.roster) || input.roster.length > 100 ||
    !Array.isArray(input.staff) || input.staff.length > 30
  ) return false;

  const numbers = new Set<number>();
  for (const entry of input.roster) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const player = entry as Record<string, unknown>;
    if (Object.keys(player).sort().join(",") !== "jerseyNumber,name,role") return false;
    if (typeof player.name !== "string" || player.name.trim().length < 1 || player.name.trim().length > 120) return false;
    if (typeof player.role !== "string" || player.role.length > 120) return false;
    if (player.jerseyNumber !== null && (!Number.isInteger(player.jerseyNumber) || (player.jerseyNumber as number) < 0 || (player.jerseyNumber as number) > 99)) return false;
    if (typeof player.jerseyNumber === "number") {
      if (numbers.has(player.jerseyNumber)) return false;
      numbers.add(player.jerseyNumber);
    }
  }

  for (const entry of input.staff) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const member = entry as Record<string, unknown>;
    if (Object.keys(member).sort().join(",") !== "name,role") return false;
    if (typeof member.name !== "string" || member.name.trim().length < 1 || member.name.trim().length > 120) return false;
    if (typeof member.role !== "string" || member.role.trim().length < 1 || member.role.trim().length > 120) return false;
  }
  return true;
}

function isSaveRequest(value: unknown): value is {
  teamId: string | null;
  expectedUpdatedAt: string | null;
  payload: TeamDraftPayload;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return Object.keys(input).sort().join(",") === "expectedUpdatedAt,payload,teamId"
    && (input.teamId === null || (typeof input.teamId === "string" && uuidPattern.test(input.teamId)))
    && (input.expectedUpdatedAt === null || (typeof input.expectedUpdatedAt === "string" && Number.isFinite(Date.parse(input.expectedUpdatedAt))))
    && isValidTeamDraftPayload(input.payload)
    && ((input.teamId === null) === (input.expectedUpdatedAt === null));
}

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
    p_payload: request.payload,
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
    if (!isSaveRequest(data)) return { ok: false as const, code: "invalid" as const };
    return saveTeamDraft(data);
  });
