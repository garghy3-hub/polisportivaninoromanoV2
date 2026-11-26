import type { ClubProfile, MatchEvent, NewsArticle, Team } from "./content-types";
import { getCompletedEvents, getPublishedNews, getUpcomingEvents } from "./content-query";
import { articles, events, teams } from "./content-data";
import { clubProfile } from "./club-data";

/**
 * Lightweight, UI-independent content service.
 * This module is the boundary for page components; replace its backing data
 * with a remote adapter in a separately authorized integration phase.
 */
export interface ClubContentService {
  news(): NewsArticle[];
  upcoming(from?: Date): MatchEvent[];
  results(): MatchEvent[];
  teamsByCategory(category: Team["category"]): Team[];
  profile(): ClubProfile;
}

export const localContentService: ClubContentService = {
  news: () => getPublishedNews(articles),
  upcoming: (from) => getUpcomingEvents(events, from),
  results: () => getCompletedEvents(events),
  teamsByCategory: (category) => teams.filter((team) => team.category === category),
  profile: () => clubProfile,
};
