import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isStrictTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !timestampPattern.test(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59
    || Number(second) > 59) return false;
  const zone = /([+-])(\d{2}):(\d{2})$/.exec(value);
  if (zone && (Number(zone[2]) > 14 || Number(zone[3]) > 59
    || (Number(zone[2]) === 14 && Number(zone[3]) !== 0))) return false;
  return Number.isFinite(Date.parse(value));
}

const draftKeys = ["startsAt", "homeTeam", "awayTeam", "eventType", "roundLabel", "seasonLabel",
  "venue", "competition", "status", "homeScore", "awayScore", "notes"] as const;

function isValidDraftPayload(value: unknown): value is Record<(typeof draftKeys)[number], unknown> {
  if (!isRecord(value) || !hasExactKeys(value, draftKeys)) return false;
  const strings = ["homeTeam", "awayTeam", "eventType", "roundLabel", "seasonLabel",
    "venue", "competition", "status", "notes"] as const;
  if (!strings.every((key) => typeof value[key] === "string")) return false;
  if (!isStrictTimestamp(value.startsAt)) return false;
  const homeTeam = (value.homeTeam as string).trim();
  const awayTeam = (value.awayTeam as string).trim();
  if (!homeTeam || homeTeam.length > 120 || !awayTeam || awayTeam.length > 120
    || homeTeam.toLocaleLowerCase("it-IT") === awayTeam.toLocaleLowerCase("it-IT")) return false;
  if (!["match", "training", "club-event", "other"].includes(value.eventType as string)
    || !["scheduled", "postponed", "cancelled", "completed"].includes(value.status as string)) return false;
  if ((value.roundLabel as string).length > 80 || (value.seasonLabel as string).length > 40
    || (value.venue as string).length > 160 || (value.competition as string).length > 120
    || (value.notes as string).length > 1000) return false;
  const validScore = (score: unknown) => score === null
    || (typeof score === "number" && Number.isSafeInteger(score) && score >= 0 && score <= 2147483647);
  if (!validScore(value.homeScore) || !validScore(value.awayScore)) return false;
  if (value.status === "completed" && value.eventType === "match"
    && (value.homeScore === null || value.awayScore === null)) return false;
  if (value.status !== "completed" && (value.homeScore !== null || value.awayScore !== null)) return false;
  return true;
}

type CalendarAction = "submit" | "approve" | "reject" | "publish" | "unpublish";

function isValidDraftRequest(value: unknown): value is {
  eventId: string | null; expectedUpdatedAt: string | null;
  payload: Record<(typeof draftKeys)[number], unknown>;
} {
  if (!isRecord(value) || !hasExactKeys(value, ["eventId", "expectedUpdatedAt", "payload"])
    || !(value.eventId === null || (typeof value.eventId === "string" && uuidPattern.test(value.eventId)))
    || !(value.expectedUpdatedAt === null || isStrictTimestamp(value.expectedUpdatedAt))
    || !isValidDraftPayload(value.payload)) return false;
  return value.eventId === null ? value.expectedUpdatedAt === null : value.expectedUpdatedAt !== null;
}

function isValidWorkflowRequest(value: unknown): value is {
  action: CalendarAction; eventId: string; expectedUpdatedAt: string; note: string;
} {
  if (!isRecord(value) || !hasExactKeys(value, ["action", "eventId", "expectedUpdatedAt", "note"])) return false;
  return ["submit", "approve", "reject", "publish", "unpublish"].includes(value.action as string)
    && typeof value.eventId === "string" && uuidPattern.test(value.eventId)
    && isStrictTimestamp(value.expectedUpdatedAt)
    && typeof value.note === "string" && value.note.length <= 1000
    && (value.action === "reject" ? value.note.trim().length > 0 : value.note === "");
}

const saveCalendarDraft = createServerOnlyFn(async (request: {
  eventId: string | null; expectedUpdatedAt: string | null;
  payload: Record<(typeof draftKeys)[number], unknown>;
}) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role))
    return { ok: false as const, code: "forbidden" as const };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };
  const rpc = supabase as unknown as { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { code?: string } | null }> };
  const { data, error } = await rpc.rpc("calendar_editorial_command", {
    p_action: "save_draft", p_event_id: request.eventId,
    p_expected_updated_at: request.expectedUpdatedAt, p_payload: request.payload,
  });
  if (error || !isRecord(data)) return { ok: false as const, code: "internal" as const };
  if (data.ok === true && typeof data.eventId === "string" && typeof data.updatedAt === "string")
    return { ok: true as const, eventId: data.eventId, updatedAt: data.updatedAt };
  const allowed = ["forbidden", "invalid_action", "invalid_payload", "invalid_score", "invalid_date",
    "season_not_found", "not_editable", "conflict", "unauthenticated"];
  return { ok: false as const, code: typeof data.code === "string" && allowed.includes(data.code)
    ? data.code : "internal" };
});

export const saveCalendarDraftFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isValidDraftRequest(data)) return { ok: false as const, code: "invalid" as const };
    return saveCalendarDraft(data);
  });

const runCalendarWorkflow = createServerOnlyFn(async (request: {
  action: CalendarAction; eventId: string; expectedUpdatedAt: string; note: string;
}) => {
  const actor = await getActiveEditorialActor();
  if (!actor) return { ok: false as const, code: "unauthenticated" as const };
  if (!["editor", "publisher", "administrator"].includes(actor.role))
    return { ok: false as const, code: "forbidden" as const };
  if (["approve", "reject", "publish", "unpublish"].includes(request.action)
    && !["publisher", "administrator"].includes(actor.role))
    return { ok: false as const, code: "forbidden" as const };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { ok: false as const, code: "not-configured" as const };
  const rpc = supabase as unknown as { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { code?: string } | null }> };
  const { data, error } = await rpc.rpc("calendar_editorial_workflow_command", {
    p_action: request.action, p_event_id: request.eventId,
    p_expected_updated_at: request.expectedUpdatedAt,
    p_payload: request.action === "reject" ? { note: request.note } : {},
  });
  if (error || !isRecord(data)) return { ok: false as const, code: "internal" as const };
  if (data.ok === true && typeof data.eventId === "string" && typeof data.updatedAt === "string"
    && typeof data.editorialStatus === "string")
    return { ok: true as const, eventId: data.eventId, updatedAt: data.updatedAt,
      editorialStatus: data.editorialStatus };
  const allowed = ["forbidden", "invalid_action", "invalid_payload", "not_found",
    "conflict", "invalid_transition", "unauthenticated"];
  return { ok: false as const, code: typeof data.code === "string" && allowed.includes(data.code)
    ? data.code : "internal" };
});

export const calendarWorkflowCommandFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!isValidWorkflowRequest(data)) return { ok: false as const, code: "invalid" as const };
    return runCalendarWorkflow(data);
  });
