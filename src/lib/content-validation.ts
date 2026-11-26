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
