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

const publisher: EditorialActor = {
  sessionId: "session-2",
  id: "publisher-1",
  role: "publisher",
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
      reviewDecision: vi.fn().mockResolvedValue({ ok: true, value: record }),
      publishApproved: vi.fn().mockResolvedValue({ ok: true, value: record }),
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

  it("normalizes unexpected repository errors without leaking adapter details", async () => {
    vi.mocked(repository.createDraft).mockRejectedValueOnce(
      new Error("database password and SQL internals"),
    );
    const result = await service.createDraft(editor, validContent);
    expect(result).toEqual({
      ok: false,
      code: "internal",
      message: "Operazione editoriale non riuscita. Riprova o contatta un amministratore.",
    });
    expect(JSON.stringify(result)).not.toContain("database password");
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

  it("does not allow an editor to approve or publish", async () => {
    const input = {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
    };
    expect(await service.approve(editor, input)).toEqual({ ok: false, code: "forbidden" });
    expect(await service.publish(editor, input)).toEqual({ ok: false, code: "forbidden" });
    expect(repository.reviewDecision).not.toHaveBeenCalled();
    expect(repository.publishApproved).not.toHaveBeenCalled();
  });

  it("requires a reason when rejecting a revision", async () => {
    const result = await service.reject(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      reviewNote: "   ",
    });
    expect(result).toEqual({
      ok: false,
      code: "invalid",
      message: "Una motivazione è obbligatoria per rifiutare la revisione.",
    });
    expect(repository.reviewDecision).not.toHaveBeenCalled();
  });

  it("records a rejection reason and rejects oversized review notes", async () => {
    const rejected = await service.reject(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 2,
      reviewNote: "Dati da verificare.",
    });
    expect(rejected).toEqual({ ok: true, value: record });
    expect(repository.reviewDecision).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 2,
      decision: "rejected",
      reviewNote: "Dati da verificare.",
      actor: publisher,
    });

    vi.mocked(repository.reviewDecision).mockClear();
    const tooLong = await service.reject(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 2,
      reviewNote: "x".repeat(1001),
    });
    expect(tooLong).toEqual({
      ok: false,
      code: "invalid",
      message: "La nota di revisione non può superare 1000 caratteri.",
    });
    expect(repository.reviewDecision).not.toHaveBeenCalled();
  });

  it("rejects malformed review-note values at runtime", async () => {
    const result = await service.reject(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      reviewNote: 42 as unknown as string,
    });
    expect(result).toEqual({
      ok: false,
      code: "invalid",
      message: "La nota di revisione deve essere un testo valido.",
    });
    expect(repository.reviewDecision).not.toHaveBeenCalled();
  });

  it("records publisher approval with the expected version", async () => {
    await service.approve(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 4,
      reviewNote: "Contenuto verificato.",
    });
    expect(repository.reviewDecision).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 4,
      decision: "approved",
      reviewNote: "Contenuto verificato.",
      actor: publisher,
    });
  });

  it("publishes only through the publisher service permission", async () => {
    await service.publish(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 5,
    });
    expect(repository.publishApproved).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 5,
      actor: publisher,
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
