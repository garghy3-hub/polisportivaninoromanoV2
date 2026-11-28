import { describe, expect, it } from "vitest";
import { toPublicNewsArticlePage } from "./news-public-list-view";

const projection = {
  articleId: "article-42",
  revisionId: "revision-7",
  publishedAt: "2026-11-27T10:00:00.000Z",
  content: {
    title: "Titolo ufficiale",
    slug: "titolo-ufficiale",
    category: "official",
    excerpt: "Sintesi della notizia.",
    body: "Testo completo.",
    seoTitle: "",
    seoDescription: "",
    imageUrl: "",
    imageAlt: "",
  },
};

describe("public News list view mapper", () => {
  it("maps a valid bounded page and preserves its opaque cursor", () => {
    expect(toPublicNewsArticlePage({ items: [projection], nextCursor: "opaque-next" })).toEqual({
      items: [{
        id: "article-42",
        slug: "titolo-ufficiale",
        title: "Titolo ufficiale",
        excerpt: "Sintesi della notizia.",
        status: "published",
        category: "official",
        body: "Testo completo.",
        createdAt: projection.publishedAt,
        updatedAt: projection.publishedAt,
        publishedAt: projection.publishedAt,
      }],
      nextCursor: "opaque-next",
    });
  });

  it("maps an empty page without inventing content", () => {
    expect(toPublicNewsArticlePage({ items: [], nextCursor: null })).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it("rejects malformed envelopes, oversized pages, and invalid projections", () => {
    expect(toPublicNewsArticlePage(null)).toBeNull();
    expect(toPublicNewsArticlePage({ items: [], nextCursor: null, privateData: true })).toBeNull();
    expect(toPublicNewsArticlePage({ items: [null], nextCursor: null })).toBeNull();
    expect(toPublicNewsArticlePage({
      items: Array.from({ length: 51 }, (_, index) => ({
        ...projection,
        articleId: `article-${index}`,
        content: { ...projection.content, slug: `articolo-${index}` },
      })),
      nextCursor: null,
    })).toBeNull();
  });

  it("rejects duplicate article IDs or public slugs", () => {
    expect(toPublicNewsArticlePage({ items: [projection, projection], nextCursor: null })).toBeNull();

    const duplicateSlug = {
      ...projection,
      articleId: "article-43",
      revisionId: "revision-8",
    };
    expect(toPublicNewsArticlePage({ items: [projection, duplicateSlug], nextCursor: null })).toBeNull();
  });
});
