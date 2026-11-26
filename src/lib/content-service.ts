import type { ClubProfile, MatchEvent, NewsArticle, SiteSettings, Team } from "./content-types";
import { getCompletedEvents, getPublishedNews, getUpcomingEvents } from "./content-query";
import { articles, events, teams } from "./content-data";
import { clubProfile } from "./club-data";
import { siteSettings } from "./site-data";
import { validateClubProfile, validateSiteSettings } from "./content-validation";

/**
 * Lightweight, UI-independent content service.
 * This module is the boundary for page components; replace its backing data
 * with a remote adapter in a separately authorized integration phase.
 */
export interface ClubContentService {
  news(): NewsArticle[];
  articleBySlug(slug: string): NewsArticle | undefined;
  upcoming(from?: Date): MatchEvent[];
  results(): MatchEvent[];
  teamsByCategory(category: Team["category"]): Team[];
  profile(): ClubProfile;
  settings(): SiteSettings;
  validateSettings(): string[];
  validateProfile(): string[];
}

export const localContentService: ClubContentService = {
  news: () => getPublishedNews(articles),
  articleBySlug: (slug) => getPublishedNews(articles).find((article) => article.slug === slug),
  upcoming: (from) => getUpcomingEvents(events, from),
  results: () => getCompletedEvents(events),
  teamsByCategory: (category) => teams.filter((team) => team.category === category),
  profile: () => clubProfile,
  settings: () => siteSettings,
  validateSettings: () => validateSiteSettings(siteSettings),
  validateProfile: () => validateClubProfile(clubProfile),
};
