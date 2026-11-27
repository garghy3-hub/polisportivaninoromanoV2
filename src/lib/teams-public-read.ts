import type { Tables } from "./supabase/database.types";
import type { Player, Team, TeamStaff } from "./content-types";

type TeamRow = Tables<"teams">;
type SeasonRow = Tables<"seasons">;
type MemberRow = Tables<"team_members">;
type StaffRow = Tables<"team_staff">;
type MediaRow = Tables<"media_assets">;

export interface PublishedTeamRows {
  teams: TeamRow[];
  seasons: Pick<SeasonRow, "id" | "label">[];
  members: MemberRow[];
  staff: StaffRow[];
  media: MediaRow[];
}

export type PublicMediaUrl = (bucket: string, storageKey: string) => string;

export function mapPublishedTeams(
  rows: PublishedTeamRows,
  publicMediaUrl: PublicMediaUrl,
): Team[] {
  const seasons = new Map(rows.seasons.map((season) => [season.id, season.label]));
  const media = new Map(
    rows.media
      .filter((asset) => asset.is_public)
      .map((asset) => [asset.id, publicMediaUrl(asset.bucket_id, asset.storage_key)]),
  );
  const membersByTeam = new Map<string, MemberRow[]>();
  const staffByTeam = new Map<string, StaffRow[]>();

  for (const member of rows.members) {
    if (!member.is_published) continue;
    const current = membersByTeam.get(member.team_id) ?? [];
    current.push(member);
    membersByTeam.set(member.team_id, current);
  }
  for (const member of rows.staff) {
    if (!member.is_published) continue;
    const current = staffByTeam.get(member.team_id) ?? [];
    current.push(member);
    staffByTeam.set(member.team_id, current);
  }

  return rows.teams
    .filter((team) =>
      team.is_published &&
      (team.category === "senior" || team.category === "youth") &&
      (team.season_id === null || seasons.has(team.season_id)),
    )
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name, "it"))
    .map((team): Team => {
      const logoUrl = team.logo_asset_id ? media.get(team.logo_asset_id) : undefined;
      const roster: Player[] = (membersByTeam.get(team.id) ?? [])
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name, "it"))
        .map((member) => {
          const photoUrl = member.photo_asset_id ? media.get(member.photo_asset_id) : undefined;
          return {
            id: member.id,
            name: member.name,
            ...(member.jersey_number === null ? {} : { jerseyNumber: member.jersey_number }),
            ...(member.position ? { role: member.position } : {}),
            ...(member.biography ? { biography: member.biography } : {}),
            ...(photoUrl ? { photoUrl, photoAlt: rows.media.find((asset) => asset.id === member.photo_asset_id)?.alt_text ?? "" } : {}),
            visible: true,
            order: member.display_order,
          };
        });
      const teamStaff: TeamStaff[] = (staffByTeam.get(team.id) ?? [])
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name, "it"))
        .map((member) => {
          const photoUrl = member.photo_asset_id ? media.get(member.photo_asset_id) : undefined;
          return {
            id: member.id,
            name: member.name,
            role: member.role_label,
            ...(member.biography ? { biography: member.biography } : {}),
            ...(photoUrl ? { photoUrl, photoAlt: rows.media.find((asset) => asset.id === member.photo_asset_id)?.alt_text ?? "" } : {}),
            visible: true,
            order: member.display_order,
          };
        });
      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        category: team.category,
        ...(team.season_id && seasons.get(team.season_id) ? { season: seasons.get(team.season_id)! } : {}),
        ...(team.description ? { description: team.description } : {}),
        ...(logoUrl ? { logoUrl, logoAlt: rows.media.find((asset) => asset.id === team.logo_asset_id)?.alt_text ?? "" } : {}),
        roster,
        staff: teamStaff,
        visible: true,
        order: team.display_order,
      };
    });
}
