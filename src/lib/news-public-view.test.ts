import { describe, expect, it } from "vitest";
import { toPublicNewsArticle } from "./news-public-view";

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
    seoTitle: "Titolo SEO",
    seoDescription: "Descrizione SEO",
    imageUrl: "https://cdn.example.org/news.jpg",
    imageAlt: "La squadra durante la gara",
  },
};

describe("public News view mapper", () => {
  it("maps a valid published projection to the public article view model", () => {
    expect(toPublicNewsArticle(projection)).toEqual({
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
      seoTitle: "Titolo SEO",
      seoDescription: "Descrizione SEO",
      coverImageUrl: "https://cdn.example.org/news.jpg",
      coverImageAlt: "La squadra durante la gara",
      socialImageUrl: "https://cdn.example.org/news.jpg",
      socialImageAlt: "La squadra durante la gara",
    });
  });

  it("omits empty image and SEO fields rather than inventing fallback values", () => {
    const value = {
      ...projection,
      content: {
        ...projection.content,
        seoTitle: "",
        seoDescription: "",
        imageUrl: "",
        imageAlt: "",
      },
    };
    const result = toPublicNewsArticle(value);
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("coverImageUrl");
    expect(result).not.toHaveProperty("coverImageAlt");
    expect(result).not.toHaveProperty("socialImageUrl");
    expect(result).not.toHaveProperty("seoTitle");
    expect(result).not.toHaveProperty("seoDescription");
  });

  it("rejects malformed, mismatched, or metadata-expanded projections", () => {
    expect(toPublicNewsArticle(null)).toBeNull();
    expect(toPublicNewsArticle({ ...projection, content: { ...projection.content, slug: "bad slug" } })).toBeNull();
    expect(toPublicNewsArticle({ ...projection, internalReviewNote: "private" })).toBeNull();
    expect(toPublicNewsArticle({ ...projection, content: { ...projection.content, creatorId: "private-user" } })).toBeNull();
  });
});
