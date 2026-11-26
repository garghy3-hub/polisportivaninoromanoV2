import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorialActor } from "../src/lib/editorial-session";
import {
  createNewsEditorialService,
  type NewsDraftContent,
  type NewsEditorialRepository,
  type NewsRevisionRecord,
} from "../src/lib/server/news-editorial-service";

const editor: EditorialActor = {
  sessionId: "session-1",
  id: "editor-1",
  role: "editor",
};

const validContent: NewsDraftContent = {
  title: "Una notizia di prova",
  slug: "una-notizia-di-prova",
  category: "official",
  excerpt: "Un sommario di prova.",
  body: "Testo della notizia di prova.",
  seoTitle: "",
  seoDescription: "",
};

const record: NewsRevisionRecord = {
  revision: {
    id: "revision-1",
    entityType: "article",
    entityId: "article-1",
    status: "draft",
    content: validContent,
    createdAt: "2026-11-26T20:00:00.000Z",
    createdBy: editor.id,
    updatedAt: "2026-11-26T20:00:00.000Z",
    updatedBy: editor.id,
  },
  version: 1,
};

describe("provider-neutral News editorial service", () => {
  let repository: NewsEditorialRepository;
  let service: ReturnType<typeof createNewsEditorialService>;

  beforeEach(() => {
    repository = {
      createDraft: vi.fn().mockResolvedValue({ ok: true, value: record }),
      updateDraft: vi.fn().mockResolvedValue({ ok: true, value: record }),
      submitForReview: vi.fn().mockResolvedValue({ ok: true, value: record }),
    };
    service = createNewsEditorialService(repository, ["official", "match-report"]);
  });

  it("rejects unauthenticated and insufficient actors before repository access", async () => {
    expect(await service.createDraft(null, validContent)).toEqual({
      ok: false,
      code: "unauthenticated",
    });
    expect(await service.createDraft({ ...editor, role: "reader" }, validContent)).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("validates the draft and configured category before persistence", async () => {
    const invalid = await service.createDraft(editor, {
      ...validContent,
      title: " ",
      category: "not-configured",
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.code).toBe("invalid");
      expect(invalid.issues?.some(issue => issue.field === "title")).toBe(true);
      expect(invalid.issues?.some(issue => issue.field === "category")).toBe(true);
    }
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("passes trusted actor and validated content to the repository", async () => {
    expect(await service.createDraft(editor, validContent)).toEqual({
      ok: true,
      value: record,
    });
    expect(repository.createDraft).toHaveBeenCalledWith({
      actor: editor,
      content: validContent,
    });
  });

  it("requires a positive optimistic version for draft updates", async () => {
    const result = await service.updateDraft(editor, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 0,
      content: validContent,
    });
    expect(result).toEqual({
      ok: false,
      code: "invalid",
      message: "Valid article and revision IDs plus a positive expected version are required.",
    });
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it("rejects missing revision identifiers before repository access", async () => {
    const result = await service.updateDraft(editor, {
      articleId: " ",
      revisionId: "revision-1",
      expectedVersion: 1,
      content: validContent,
    });
    expect(result).toEqual({
      ok: false,
      code: "invalid",
      message: "Valid article and revision IDs plus a positive expected version are required.",
    });
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it("forwards the version precondition and actor for updates", async () => {
    await service.updateDraft(editor, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 3,
      content: validContent,
    });
    expect(repository.updateDraft).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 3,
      content: validContent,
      actor: editor,
    });
  });

  it("allows an editor to submit a revision with a version precondition", async () => {
    await service.submitForReview(editor, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
    });
    expect(repository.submitForReview).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      actor: editor,
    });
  });
});
