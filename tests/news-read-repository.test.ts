import { describe, expect, it } from "vitest";
import {
  isValidNewsPublishedArticle,
  isValidNewsReadItem,
  isValidNewsReadPageEnvelope,
} from "../src/lib/news-read-repository";

const validContent = {
  title: "Titolo della notizia",
  slug: "titolo-della-notizia",
  category: "official",
  excerpt: "Un breve riepilogo.",
  body: "Testo completo della notizia.",
  seoTitle: "Titolo SEO",
  seoDescription: "Descrizione SEO.",
  imageUrl: "",
  imageAlt: "",
};

const validItem = {
  articleId: "article-1",
  revisionId: "revision-1",
  creatorId: "editor-1",
  status: "draft",
  createdAt: "2026-11-27T05:00:00Z",
  updatedAt: "2026-11-27T05:30:00+01:00",
  content: validContent,
};

const validPublishedArticle = {
  articleId: "article-1",
  revisionId: "revision-3",
  publishedAt: "2026-11-27T06:00:00Z",
  content: validContent,
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
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null, internal: true }, 20)).toBe(false);
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
      { ...validItem, content: { ...validContent, title: " " } },
      { ...validItem, content: { ...validContent, slug: "" } },
      { ...validItem, content: { ...validContent, body: 42 } },
      { ...validItem, content: { ...validContent, internalNotes: "non pubblico" } },
      { ...validItem, internalNotes: "non pubblico" },
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


  it("enforces the same normalized slug and content bounds as the editorial form", () => {
    const invalidContent = [
      { ...validContent, slug: "Titolo non valido" },
      { ...validContent, slug: "titolo--non-valido" },
      { ...validContent, title: "t".repeat(141) },
      { ...validContent, excerpt: "e".repeat(301) },
      { ...validContent, body: "b".repeat(20001) },
      { ...validContent, seoTitle: "s".repeat(71) },
      { ...validContent, seoDescription: "d".repeat(161) },
      { ...validContent, excerpt: " " },
      { ...validContent, body: " " },
      { ...validContent, imageUrl: "javascript:alert(1)", imageAlt: "Immagine" },
      { ...validContent, imageUrl: "https://example.com/image.jpg", imageAlt: " " },
      { ...validContent, imageUrl: "https://example.com/image.jpg", imageAlt: "a".repeat(201) },
    ];
    for (const content of invalidContent) {
      expect(isValidNewsReadItem({ ...validItem, content })).toBe(false);
      expect(isValidNewsPublishedArticle({ ...validPublishedArticle, content })).toBe(false);
    }
  });

  it("rejects non-object payloads", () => {
    for (const value of [null, [], "news", 42]) {
      expect(isValidNewsReadItem(value)).toBe(false);
    }
  });
});

describe("News public projection guard", () => {
  it("accepts only a well-formed allow-listed published projection", () => {
    expect(isValidNewsPublishedArticle(validPublishedArticle)).toBe(true);
  });

  it("rejects incomplete or malformed public projections", () => {
    const invalid = [
      null,
      [],
      { ...validPublishedArticle, articleId: "" },
      { ...validPublishedArticle, revisionId: " " },
      { ...validPublishedArticle, publishedAt: "2026-02-31T12:00:00Z" },
      { ...validPublishedArticle, publishedAt: "2026-11-27T12:00:00" },
      { ...validPublishedArticle, content: null },
      { ...validPublishedArticle, content: { ...validContent, title: "" } },
      { ...validPublishedArticle, content: { ...validContent, auditNote: "internal" } },
      { ...validPublishedArticle, creatorId: "editor-1" },
      { ...validPublishedArticle, status: "draft" },
    ];

    for (const value of invalid) {
      expect(isValidNewsPublishedArticle(value)).toBe(false);
    }
  });
});
