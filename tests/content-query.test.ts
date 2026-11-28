import { describe, expect, it } from "vitest";
import { getPublishedNews, getUpcomingEvents, getCompletedEvents, getTeamsByCategory } from "../src/lib/content-query";
import type { NewsArticle, MatchEvent, Team } from "../src/lib/content-types";

const news = (id: string, status: NewsArticle["status"], publishedAt?: string): NewsArticle => ({
  id, slug: id, title: id, body: "Test", category: "official", status,
  createdAt: "2026-01-01", updatedAt: "2026-01-01", publishedAt,
});
const events: MatchEvent[] = [
  { id: "future-later", dateTime: "2030-01-02T18:00:00Z", homeTeam: "A", awayTeam: "B", status: "scheduled", order: 2 },
  { id: "future-earlier", dateTime: "2030-01-01T18:00:00Z", homeTeam: "A", awayTeam: "B", status: "scheduled", order: 1 },
  { id: "hidden", dateTime: "2030-01-01T10:00:00Z", homeTeam: "A", awayTeam: "B", status: "scheduled", visible: false },
  { id: "cancelled", dateTime: "2030-01-01T11:00:00Z", homeTeam: "A", awayTeam: "B", status: "cancelled" },
  { id: "finished", dateTime: "2029-12-01T18:00:00Z", homeTeam: "A", awayTeam: "B", status: "completed", homeScore: 3, awayScore: 0 },
];

describe("public content query helpers", () => {
  it("returns only valid published news ordered newest first without mutating input", () => {
    const input = [news("old", "published", "2026-01-01"), news("draft", "draft"), news("new", "published", "2026-03-01"), news("bad-date", "published", "bad")];
    const original = input.slice();
    expect(getPublishedNews(input).map(a => a.id)).toEqual(["new", "old"]);
    expect(input).toEqual(original);
  });

  it("filters and orders upcoming events relative to a supplied date", () => {
    expect(getUpcomingEvents(events, new Date("2029-12-31T00:00:00Z")).map(e => e.id)).toEqual(["future-earlier", "future-later"]);
  });

  it("returns visible completed events with valid scores, newest first", () => {
    const finished = getCompletedEvents(events);
    expect(finished.map(e => e.id)).toEqual(["finished"]);
  });

  it("filters teams by category without modifying source collection", () => {
    const teams: Team[] = [{ id: "s", name: "Senior", slug: "senior", category: "senior" }, { id: "u", name: "Youth", slug: "youth", category: "youth" }];
    expect(getTeamsByCategory(teams, "youth").map(t => t.id)).toEqual(["u"]);
    expect(teams).toHaveLength(2);
  });
});
