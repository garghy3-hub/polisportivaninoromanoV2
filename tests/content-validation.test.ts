import { describe, expect, it } from "vitest";
import { validateArticle, validateEvent, validateContentCollections, validateMediaAsset } from "../src/lib/content-validation";
import type { NewsArticle, MatchEvent, MediaAsset } from "../src/lib/content-types";

const article: NewsArticle = {
  id: "article-1", slug: "test-news", title: "Test", body: "Body",
  category: "official", status: "published",
  createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z",
  publishedAt: "2026-01-01T10:00:00Z",
};
const event: MatchEvent = {
  id: "event-1", dateTime: "2026-01-02T18:00:00Z", homeTeam: "Home", awayTeam: "Away", status: "completed", homeScore: 3, awayScore: 1, outcome: "win",
};
const media: MediaAsset = {
  id: "media-1", storageKey: "media/asset.jpg", fileName: "asset.jpg", mimeType: "image/jpeg",
  sizeBytes: 1200, publicUrl: "https://example.com/asset.jpg", altText: "Descrizione",
  uploadedAt: "2026-01-01T10:00:00Z", uploadedBy: "editor-1",
};

describe("editorial content validation", () => {
  it("accepts valid article, event and media records", () => {
    expect(validateArticle(article)).toEqual([]);
    expect(validateEvent(event)).toEqual([]);
    expect(validateMediaAsset(media)).toEqual([]);
  });

  it("rejects published articles without publication dates and unsafe image links", () => {
    expect(validateArticle({ ...article, publishedAt: undefined }).some(issue => issue.includes("publishedAt"))).toBe(true);
    expect(validateArticle({ ...article, coverImageUrl: "javascript:alert(1)", coverImageAlt: "x" }).length).toBeGreaterThan(0);
  });

  it("rejects event score/outcome inconsistencies", () => {
    expect(validateEvent({ ...event, outcome: "loss" }).some(issue => issue.includes("outcome"))).toBe(true);
    expect(validateEvent({ ...event, homeScore: -1 }).length).toBeGreaterThan(0);
  });

  it("requires scores only for completed events and rejects scores for other statuses", () => {
    expect(validateEvent({ ...event, status: "scheduled", homeScore: undefined, awayScore: undefined, outcome: undefined })).toEqual([]);
    expect(validateEvent({ ...event, status: "scheduled" }).some(issue => issue.includes("only be set for completed"))).toBe(true);
    expect(validateEvent({ ...event, status: "completed", homeScore: undefined, awayScore: undefined, outcome: undefined }).some(issue => issue.includes("require non-negative integer scores"))).toBe(true);
  });

  it("detects duplicate IDs and slugs in collections", () => {
    const duplicate = { ...article, id: "ARTICLE-1", slug: "TEST-news" };
    expect(validateContentCollections({ articles: [article, duplicate] }).some(issue => issue.includes("Duplicate article"))).toBe(true);
  });

  it("requires media alt text, valid URL and positive file size", () => {
    expect(validateMediaAsset({ ...media, altText: "" }).length).toBeGreaterThan(0);
    expect(validateMediaAsset({ ...media, publicUrl: "javascript:alert(1)" }).length).toBeGreaterThan(0);
    expect(validateMediaAsset({ ...media, sizeBytes: 0 }).length).toBeGreaterThan(0);
  });

  it("accepts only supported image formats and caps uploads at 10 MiB", () => {
    expect(validateMediaAsset({ ...media, mimeType: "image/svg+xml" }).some(issue => issue.includes("MIME"))).toBe(true);
    expect(validateMediaAsset({ ...media, sizeBytes: 10 * 1024 * 1024 + 1 }).some(issue => issue.includes("10 MiB"))).toBe(true);
    expect(validateMediaAsset({ ...media, sizeBytes: 10 * 1024 * 1024 })).toEqual([]);
  });

  it("rejects unsafe storage keys and file names", () => {
    expect(validateMediaAsset({ ...media, storageKey: "../private/asset.jpg" }).some(issue => issue.includes("storage key"))).toBe(true);
    expect(validateMediaAsset({ ...media, storageKey: "media\\\\asset.jpg" }).some(issue => issue.includes("storage key"))).toBe(true);
    expect(validateMediaAsset({ ...media, fileName: "../asset.jpg" }).some(issue => issue.includes("file name"))).toBe(true);
  });
});
