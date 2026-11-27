import { describe, expect, it } from "vitest";
import {
  isValidNewsReadItem,
  isValidNewsReadPageEnvelope,
} from "../src/lib/news-read-repository";

const validItem = {
  articleId: "article-1",
  revisionId: "revision-1",
  creatorId: "editor-1",
  status: "draft",
  createdAt: "2026-11-27T05:00:00Z",
  updatedAt: "2026-11-27T05:30:00+01:00",
  content: {
    title: "Titolo della notizia",
    slug: "titolo-della-notizia",
    category: "prima-squadra",
    excerpt: "Un breve riepilogo.",
    body: "Testo completo della notizia.",
    seoTitle: "Titolo SEO",
    seoDescription: "Descrizione SEO.",
  },
};

describe("News read page envelope guard", () => {
  it("accepts bounded page envelopes and nullable cursor", () => {
    expect(isValidNewsReadPageEnvelope({ items: [1, 2], nextCursor: "next" }, 2)).toBe(true);
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 20)).toBe(true);
  });

  it("rejects malformed, oversized or unbounded envelopes", () => {
    for (const payload of [null, [], { items: "not-array", nextCursor: null }, { items: [1, 2, 3], nextCursor: null }, { items: [], nextCursor: " " }, { items: [], nextCursor: "x".repeat(513) }, { items: [], nextCursor: 5 }]) {
      expect(isValidNewsReadPageEnvelope(payload, 2)).toBe(false);
    }
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 51)).toBe(false);
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 0)).toBe(false);
  });
});

describe("News read item guard", () => {
  it("accepts a structurally valid editorial item", () => {
    expect(isValidNewsReadItem(validItem)).toBe(true);
  });

  it("rejects missing identifiers, unknown statuses and malformed content", () => {
    const invalidItems = [
      { ...validItem, articleId: " " },
      { ...validItem, revisionId: "x".repeat(129) },
      { ...validItem, creatorId: "" },
      { ...validItem, status: "scheduled" },
      { ...validItem, content: null },
      { ...validItem, content: { ...validItem.content, title: " " } },
      { ...validItem, content: { ...validItem.content, slug: "" } },
      { ...validItem, content: { ...validItem.content, body: 42 } },
    ];

    for (const item of invalidItems) {
      expect(isValidNewsReadItem(item)).toBe(false);
    }
  });

  it("rejects impossible dates and timestamps without a timezone", () => {
    expect(isValidNewsReadItem({ ...validItem, createdAt: "2026-02-31T12:00:00Z" })).toBe(false);
    expect(isValidNewsReadItem({ ...validItem, updatedAt: "2026-11-27T12:00:00" })).toBe(false);
    expect(isValidNewsReadItem({ ...validItem, createdAt: "2026-11-27" })).toBe(false);
  });

  it("rejects non-object payloads", () => {
    for (const value of [null, [], "news", 42]) {
      expect(isValidNewsReadItem(value)).toBe(false);
    }
  });
});
