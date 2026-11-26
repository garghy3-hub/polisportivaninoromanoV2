import type { MatchEvent, NewsArticle, Team } from "./content-types";
import { isValidEventDate } from "./content-query";

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateArticle(article: NewsArticle): string[] {
  const issues: string[] = [];
  if (!nonEmpty(article.id)) issues.push("Missing article id.");
  if (!nonEmpty(article.slug)) issues.push("Missing article slug.");
  if (!nonEmpty(article.title)) issues.push("Missing article title.");
  if (!nonEmpty(article.body)) issues.push("Missing article body.");
  if (!["official", "match-report", "interview", "youth", "club-life"].includes(article.category))
    issues.push("Unknown article category.");
  if (!["draft", "published", "archived"].includes(article.status))
    issues.push("Unknown publication status.");
  if (!Number.isFinite(Date.parse(article.createdAt))) issues.push("Invalid createdAt date.");
  if (!Number.isFinite(Date.parse(article.updatedAt))) issues.push("Invalid updatedAt date.");
  if (article.status === "published" && !Number.isFinite(Date.parse(article.publishedAt ?? "")))
    issues.push("Published articles require a valid publishedAt date.");
  return issues;
}

export function validateTeam(team: Team): string[] {
  const issues: string[] = [];
  if (!nonEmpty(team.id)) issues.push("Missing team id.");
  if (!nonEmpty(team.name)) issues.push("Missing team name.");
  if (!nonEmpty(team.slug)) issues.push("Missing team slug.");
  if (!["senior", "youth"].includes(team.category)) issues.push("Unknown team category.");
  const numbers = team.roster?.flatMap((player) =>
    player.jerseyNumber === undefined ? [] : [player.jerseyNumber],
  ) ?? [];
  if (numbers.some((number) => !Number.isInteger(number) || number < 0))
    issues.push("Roster jersey numbers must be non-negative integers.");
  return issues;
}

export function validateEvent(event: MatchEvent): string[] {
  const issues: string[] = [];
  if (!nonEmpty(event.id)) issues.push("Missing event id.");
  if (!isValidEventDate(event.dateTime)) issues.push("Invalid event date/time.");
  if (!nonEmpty(event.homeTeam)) issues.push("Missing home team.");
  if (!nonEmpty(event.awayTeam)) issues.push("Missing away team.");
  if (event.homeTeam === event.awayTeam) issues.push("Home and away teams must differ.");
  if (!["scheduled", "postponed", "cancelled", "completed"].includes(event.status))
    issues.push("Unknown event status.");
  if (event.status === "completed" &&
    (!Number.isInteger(event.homeScore) || !Number.isInteger(event.awayScore) ||
      (event.homeScore ?? -1) < 0 || (event.awayScore ?? -1) < 0))
    issues.push("Completed events require non-negative integer scores.");
  return issues;
}

/** Validate collections for collisions before a batch is published or imported. */
export function validateContentCollections(input: {
  articles?: readonly NewsArticle[];
  teams?: readonly Team[];
  events?: readonly MatchEvent[];
}): string[] {
  const issues: string[] = [];
  const checkUnique = (values: readonly string[], label: string) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (!value.trim()) return;
      if (seen.has(value)) issues.push(`Duplicate ${label}: ${value}.`);
      seen.add(value);
    });
  };
  const articles = input.articles ?? [];
  const teams = input.teams ?? [];
  const events = input.events ?? [];
  checkUnique(articles.map(item => item.id), "article id");
  checkUnique(articles.map(item => item.slug), "article slug");
  checkUnique(teams.map(item => item.id), "team id");
  checkUnique(teams.map(item => item.slug), "team slug");
  checkUnique(events.map(item => item.id), "event id");
  for (const team of teams) {
    if (team.roster) checkUnique(team.roster.map(player => player.id), `player id in team ${team.slug}`);
    if (team.staff) checkUnique(team.staff.map(member => member.id), `staff id in team ${team.slug}`);
  }
  return issues;
}
