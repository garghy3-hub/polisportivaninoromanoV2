import { describe, expect, it } from "vitest";
import { isValidNewsReadItem } from "../src/lib/news-read-repository";
const valid = { articleId: "a1", revisionId: "r1", creatorId: "u1", status: "draft", createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T11:00:00Z", content: { title: "Titolo", slug: "titolo", category: "official", excerpt: "Sintesi", body: "Testo", seoTitle: "SEO", seoDescription: "Descrizione" } };
describe("News read item guard", () => {
  it("accepts a minimally complete item", () => { expect(isValidNewsReadItem(valid)).toBe(true); });
  it("rejects malformed identifiers, status, timestamps and content", () => {
    for (const bad of [null, [], { ...valid, articleId: " " }, { ...valid, revisionId: "" }, { ...valid, creatorId: " " }, { ...valid, status: "admin" }, { ...valid, createdAt: "invalid" }, { ...valid, updatedAt: "invalid" }, { ...valid, content: null }, { ...valid, content: { ...valid.content, title: " " } }, { ...valid, content: { ...valid.content, body: 2 } }]) expect(isValidNewsReadItem(bad)).toBe(false);
  });
});
