/**
 * Shared content contracts for the V2 website.
 * Keep editorial data separate from UI components and database adapters.
 * No live club information is fabricated here.
 */

export type ContentStatus = "draft" | "published" | "archived";

export interface EditorialMetadata {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author?: string;
  coverImageUrl?: string;
  tags?: string[];
}

export type NewsCategory =
  | "official"
  | "match-report"
  | "interview"
  | "youth"
  | "club-life";

export interface NewsArticle extends EditorialMetadata {
  category: NewsCategory;
  body: string;
}

export type TeamCategory = "senior" | "youth";

export interface Team {
  id: string;
  name: string;
  slug: string;
  category: TeamCategory;
  season?: string;
  description?: string;
  logoUrl?: string;
  roster?: Player[];
  staff?: TeamStaff[];
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  role?: string;
  photoUrl?: string;
}

export interface TeamStaff {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
}

export type EventStatus = "scheduled" | "postponed" | "cancelled" | "completed";
export type MatchOutcome = "win" | "loss" | "draw";

export interface MatchEvent {
  id: string;
  season?: string;
  dateTime: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  competition?: string;
  status: EventStatus;
  homeScore?: number;
  awayScore?: number;
  outcome?: MatchOutcome;
  notes?: string;
}

export interface ClubContact {
  label: string;
  value: string;
  href?: string;
}

export interface ClubProfile {
  name: string;
  shortName?: string;
  description?: string;
  address?: string;
  contacts?: ClubContact[];
  socialLinks?: ClubContact[];
}

/** Safe display helper: draft and archived items are never surfaced publicly. */
export function isPublished<T extends EditorialMetadata>(
  item: T,
): item is T & { status: "published" } {
  return item.status === "published";
}
