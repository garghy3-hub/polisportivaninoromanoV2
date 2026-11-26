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

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
}

export interface HomeFeature {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  visible: boolean;
  order: number;
}

export interface HomePageContent {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  visualEyebrow: string;
  visualTitle: string;
  visualDescription: string;
  visualTopLabel: string;
  visualTag: string;
  visualMonogram: string;
  visualCounter: string;
  heroSocialProof: string;
  brandColorsLabel: string;
  brandColorsDescriptor: string;
  artworkTitle: string;
  artworkDescription: string;
  features: HomeFeature[];
  projectEyebrow: string;
  projectTitle: string;
  projectDescription: string;
  projectActionLabel: string;
  projectActionHref: string;
  closingEyebrow: string;
  closingTitle: string;
  closingDescription: string;
  closingPrimaryLabel: string;
  closingPrimaryHref: string;
  closingSecondaryLabel: string;
  closingSecondaryHref: string;
}

export interface StandardPageContent {
  backLabel: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}
export interface NewsTopic {
  id: string; title: string; label: string; description: string;
  visible: boolean; order: number;
}
export interface NewsPageContent extends StandardPageContent {
  emptyEyebrow: string; emptyTitle: string; emptyDescription: string; topics: NewsTopic[];
}
export interface TeamPageCategory {
  id: string; title: string; eyebrow: string; emptyDescription: string;
  category: Team["category"]; visible: boolean; order: number;
}
export interface TeamsPageContent extends StandardPageContent {
  categories: TeamPageCategory[];
  asideTitle: string; asideDescription: string; asideActionLabel: string; asideActionHref: string;
}
export interface CalendarPageContent extends StandardPageContent {
  eventTypes: string[]; upcomingTitle: string; upcomingEmpty: string;
  resultsTitle: string; resultsEmpty: string;
}
export interface SocietyPillar {
  id: string; title: string; description: string; visible: boolean; order: number;
}
export interface SocietyPageContent extends StandardPageContent {
  pillars: SocietyPillar[]; asideTitle: string; asideDescription: string;
}
export interface FooterContent { copyright: string; projectLabel: string; }
export interface SiteMetadata { title: string; description: string; ogTitle: string; ogDescription: string; }
export interface BrandSettings { monogram: string; name: string; descriptor: string; ariaLabel: string; }
export interface InterfaceCopy {
  skipToContent: string;
  navigationLabel: string;
  openMenu: string;
  closeMenu: string;
}
export interface SiteSettings {
  interface: InterfaceCopy;
  brand: BrandSettings;
  site: SiteMetadata;
  navigation: NavigationItem[];
  home: HomePageContent;
  news: NewsPageContent;
  teams: TeamsPageContent;
  calendar: CalendarPageContent;
  society: SocietyPageContent;
  footer: FooterContent;
}


export type EditorialRole = "reader" | "editor" | "publisher" | "administrator";
export type RevisionStatus = "draft" | "in-review" | "approved" | "published" | "rejected";

/** Metadata for managed media; binary files belong in private/public object storage. */
export interface MediaAsset {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl?: string;
  altText: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

/** Revision envelope for draft, review, approval and publication workflows. */
export interface EditorialRevision<T> {
  id: string;
  entityType: "article" | "team" | "event" | "club-profile" | "site-settings" | "media";
  entityId: string;
  status: RevisionStatus;
  content: T;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  reviewerId?: string;
  reviewedAt?: string;
  reviewNote?: string;
  publishedAt?: string;
}

/** Append-only audit metadata; the server must author and protect these fields. */
export interface EditorialAuditEntry {
  id: string;
  actorId: string;
  actorRole: EditorialRole;
  action: "create" | "update" | "submit" | "approve" | "reject" | "publish" | "unpublish" | "archive" | "restore" | "delete";
  entityType: EditorialRevision<unknown>["entityType"];
  entityId: string;
  revisionId?: string;
  occurredAt: string;
  summary: string;
}
