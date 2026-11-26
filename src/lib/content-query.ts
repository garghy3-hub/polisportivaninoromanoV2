import type { MatchEvent, NewsArticle, Team } from "./content-types";

/** Public editorial feed: published articles only, newest publication first. */
export function getPublishedNews(articles: readonly NewsArticle[]): NewsArticle[] {
  return articles
    .filter((article) => article.status === "published" && Boolean(article.publishedAt) && Number.isFinite(Date.parse(article.publishedAt!)))
    .slice()
    .sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!));
}

/** Return a stable, sorted copy of upcoming non-cancelled events. */
export function getUpcomingEvents(
  events: readonly MatchEvent[],
  from: Date = new Date(),
): MatchEvent[] {
  return events
    .filter((event) => event.status !== "cancelled" && event.status !== "completed" && isValidEventDate(event.dateTime))
    .filter((event) => Date.parse(event.dateTime) >= from.getTime())
    .slice()
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));
}

/** Results are shown only for completed events with a recorded score. */
export function getCompletedEvents(events: readonly MatchEvent[]): MatchEvent[] {
  return events
    .filter(
      (event) =>
        event.status === "completed" &&
        isValidEventDate(event.dateTime) &&
        Number.isInteger(event.homeScore) &&
        Number.isInteger(event.awayScore) &&
        (event.homeScore ?? -1) >= 0 &&
        (event.awayScore ?? -1) >= 0,
    )
    .slice()
    .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
}

/** Returns a copy, so consumers don't mutate the source collection. */
export function getTeamsByCategory(
  teams: readonly Team[],
  category: Team["category"],
): Team[] {
  return teams.filter((team) => team.category === category).slice();
}

/** Guard for malformed or unconfirmed external records before UI rendering. */
export function isValidEventDate(dateTime: string): boolean {
  return Number.isFinite(Date.parse(dateTime));
}
