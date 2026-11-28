export interface TeamDraftPayload {
  name: string;
  slug: string;
  category: "senior" | "youth";
  seasonLabel: string;
  description: string;
  roster: Array<{ name: string; jerseyNumber: number | null; role: string }>;
  staff: Array<{ name: string; role: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;\n\nfunction isStrictTimestamp(value: unknown): value is string {\n  if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$/.test(value)) return false;\n  const match = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})/.exec(value);\n  if (!match) return false;\n  const [, y, m, d, h, min, s] = match;\n  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));\n  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d)\n    || Number(h) > 23 || Number(min) > 59 || Number(s) > 59) return false;\n  const zone = /([+-])(\\d{2}):(\\d{2})$/.exec(value);\n  if (zone && (Number(zone[2]) > 14 || Number(zone[3]) > 59 || (Number(zone[2]) === 14 && Number(zone[3]) !== 0))) return false;\n  return Number.isFinite(Date.parse(value));\n}

export function isValidTeamDraftPayload(value: unknown): value is TeamDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).sort().join(",") !== "category,description,name,roster,seasonLabel,slug,staff") return false;
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

export function isValidTeamSaveRequest(value: unknown): value is {
  teamId: string | null;
  expectedUpdatedAt: string | null;
  payload: TeamDraftPayload;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return Object.keys(input).sort().join(",") === "expectedUpdatedAt,payload,teamId"
    && (input.teamId === null || (typeof input.teamId === "string" && uuidPattern.test(input.teamId)))
    && (input.expectedUpdatedAt === null || isStrictTimestamp(input.expectedUpdatedAt))
    && isValidTeamDraftPayload(input.payload)
    && ((input.teamId === null) === (input.expectedUpdatedAt === null));
}
