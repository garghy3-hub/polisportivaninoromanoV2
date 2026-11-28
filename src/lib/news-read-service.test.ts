import { describe, expect, it, vi } from "vitest";
import { createNewsReadService } from "./news-read-service";
import type { NewsReadRepository } from "./news-read-repository";

const content = {
  title: "Notizia di prova",
  slug: "notizia-di-prova",
  category: "official" as const,
  excerpt: "Riepilogo",
  body: "Contenuto",
  seoTitle: "",
  seoDescription: "",
  imageUrl: "",
  imageAlt: "",
};
const published = {
  articleId: "article-1",
  revisionId: "revision-2",
  publishedAt: "2026-11-27T10:00:00Z",
  content,
};

function makeRepository(overrides: Partial<NewsReadRepository> = {}): NewsReadRepository {
  return {
    listEditorial: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getRevision: vi.fn().mockResolvedValue(null),
    listRevisionHistory: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listAudit: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listPublished: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getPublishedBySlug: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("News read service", () => {
  it("validates query before calling repository", async () => {
    const repository = makeRepository();
    const result = await createNewsReadService(repository).listEditorial("editor-1", { pageSize: 999 });
    expect(result).toMatchObject({ ok: false, code: "invalid" });
    expect(repository.listEditorial).not.toHaveBeenCalled();
  });

  it("rejects malformed repository page and item shapes", async () => {
    const repository = makeRepository({
      listEditorial: vi.fn().mockResolvedValue({ items: [{ status: "draft" }], nextCursor: null }),
    });
    const result = await createNewsReadService(repository).listEditorial("editor-1", {});
    expect(result).toMatchObject({ ok: false, code: "internal" });
  });

  it("normalizes repository exceptions without exposing provider details", async () => {
    const repository = makeRepository({
      getPublishedBySlug: vi.fn().mockRejectedValue(new Error("SQL password details")),
    });
    const result = await createNewsReadService(repository).getPublishedBySlug("notizia-di-prova");
    expect(result).toMatchObject({ ok: false, code: "internal" });
    expect(JSON.stringify(result)).not.toContain("password");
  });

  it("returns a bounded public list and rejects duplicate or malformed projections", async () => {
    const repository = makeRepository({
      listPublished: vi.fn().mockResolvedValue({ items: [published], nextCursor: null }),
    });
    expect(await createNewsReadService(repository).listPublished({ pageSize: 10, category: "official" }))
      .toEqual({ ok: true, value: { items: [published], nextCursor: null } });

    const duplicate = makeRepository({
      listPublished: vi.fn().mockResolvedValue({ items: [published, published], nextCursor: null }),
    });
    expect(await createNewsReadService(duplicate).listPublished({}))
      .toMatchObject({ ok: false, code: "internal" });

    const invalid = makeRepository();
    expect(await createNewsReadService(invalid).listPublished({ status: "draft" }))
      .toMatchObject({ ok: false, code: "invalid" });
    expect(invalid.listPublished).not.toHaveBeenCalled();
  });

  it("returns a valid published projection only when its slug matches", async () => {
    const repository = makeRepository({ getPublishedBySlug: vi.fn().mockResolvedValue(published) });
    expect(await createNewsReadService(repository).getPublishedBySlug("notizia-di-prova"))
      .toEqual({ ok: true, value: published });

    const mismatched = makeRepository({
      getPublishedBySlug: vi.fn().mockResolvedValue({ ...published, content: { ...content, slug: "altro" } }),
    });
    expect(await createNewsReadService(mismatched).getPublishedBySlug("notizia-di-prova"))
      .toMatchObject({ ok: false, code: "internal" });
  });

  it("restricts history queries to pagination fields", async () => {
    const repository = makeRepository();
    const result = await createNewsReadService(repository).listRevisionHistory("article-1", { status: "draft" });
    expect(result).toMatchObject({ ok: false, code: "invalid" });
    expect(repository.listRevisionHistory).not.toHaveBeenCalled();
  });

  it("rejects invalid identifiers before touching the repository", async () => {
    const repository = makeRepository();
    const result = await createNewsReadService(repository).getRevision(" ", "revision-1");
    expect(result).toMatchObject({ ok: false, code: "invalid" });
    expect(repository.getRevision).not.toHaveBeenCalled();
  });
});
