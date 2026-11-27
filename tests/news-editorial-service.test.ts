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
  imageUrl: "",
  imageAlt: "",
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
      unpublish: vi.fn().mockResolvedValue({ ok: true, value: record }),
      archivePublished: vi.fn().mockResolvedValue({ ok: true, value: record }),
      restoreArchived: vi.fn().mockResolvedValue({ ok: true, value: record }),
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

  it("rejects actors carrying unexpected runtime fields", async () => {
    const extendedActor = { ...editor, administrator: true };
    await expect(service.createDraft(extendedActor as never, validContent)).resolves.toMatchObject({
      ok: false,
      code: "forbidden",
    });
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("fails closed for actors with malformed identity fields", async () => {
    const malformedActors = [
      { ...editor, id: " " },
      { ...editor, sessionId: "" },
      { ...editor, id: 42 },
      { ...editor, id: "x".repeat(129) },
      { ...editor, sessionId: "x".repeat(129) },
    ];
    for (const actor of malformedActors) {
      await expect(service.createDraft(actor as never, validContent)).resolves.toMatchObject({
        ok: false,
        code: "forbidden",
      });
    }
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("fails closed for actors with an unrecognized runtime role", async () => {
    const malformedActor = { ...editor, role: "superuser" } as never;
    await expect(service.createDraft(malformedActor, validContent)).resolves.toMatchObject({
      ok: false,
      code: "forbidden",
    });
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("sanitizes failure messages returned by repository adapters", async () => {
    vi.mocked(repository.createDraft).mockResolvedValueOnce({
      ok: false,
      code: "internal",
      message: "raw SQL and provider details",
    });
    const result = await service.createDraft(editor, validContent);
    expect(result).toEqual({
      ok: false,
      code: "internal",
      message: "Operazione editoriale non riuscita. Riprova o contatta un amministratore.",
    });
    expect(JSON.stringify(result)).not.toContain("raw SQL");
  });

  it("fails closed for unknown repository failure codes", async () => {
    vi.mocked(repository.createDraft).mockResolvedValueOnce({
      ok: false,
      code: "unexpected-provider-code",
      message: "untrusted adapter text",
    } as never);
    await expect(service.createDraft(editor, validContent)).resolves.toEqual({
      ok: false,
      code: "internal",
      message: "Operazione editoriale non riuscita. Riprova o contatta un amministratore.",
    });
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

  it("rejects unexpected fields in draft content before repository access", async () => {
    const extended = { ...validContent, isAdmin: true } as NewsDraftContent;
    await expect(service.createDraft(editor, extended)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it("rejects unexpected fields in update and lifecycle command envelopes", async () => {
    const extendedUpdate = {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      content: validContent,
      actor: publisher,
    };
    await expect(service.updateDraft(editor, extendedUpdate)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });

    const extendedCommand = {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      role: "administrator",
    };
    await expect(service.submitForReview(editor, extendedCommand)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    expect(repository.updateDraft).not.toHaveBeenCalled();
    expect(repository.submitForReview).not.toHaveBeenCalled();
  });

  it("allows an omitted optional review note while rejecting unknown review fields", async () => {
    await expect(service.approve(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
    })).resolves.toEqual({ ok: true, value: record });
    expect(repository.reviewDecision).toHaveBeenCalledWith({
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      decision: "approved",
      actor: publisher,
    });

    vi.mocked(repository.reviewDecision).mockClear();
    await expect(service.approve(publisher, {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
      reviewNote: "Ok",
      actor: editor,
    } as never)).resolves.toMatchObject({ ok: false, code: "invalid" });
    expect(repository.reviewDecision).not.toHaveBeenCalled();
  });

  it("rejects malformed command objects without throwing or calling the repository", async () => {
    const malformed = null as unknown as {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
    };
    await expect(service.submitForReview(editor, malformed)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    await expect(service.publish(publisher, malformed)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    await expect(service.approve(publisher, malformed)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    expect(repository.submitForReview).not.toHaveBeenCalled();
    expect(repository.publishApproved).not.toHaveBeenCalled();
    expect(repository.reviewDecision).not.toHaveBeenCalled();
  });

  it("rejects a malformed update envelope without throwing", async () => {
    await expect(service.updateDraft(editor, null as never)).resolves.toMatchObject({
      ok: false,
      code: "invalid",
    });
    expect(repository.updateDraft).not.toHaveBeenCalled();
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

  it("allows publisher lifecycle actions through explicit transitions", async () => {
    const input = {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 6,
    };

    await service.unpublish(publisher, input);
    expect(repository.unpublish).toHaveBeenCalledWith({ ...input, actor: publisher });

    await service.archive(publisher, input);
    expect(repository.archivePublished).toHaveBeenCalledWith({ ...input, actor: publisher });

    await service.restore(publisher, input);
    expect(repository.restoreArchived).toHaveBeenCalledWith({ ...input, actor: publisher });
  });

  it("denies lifecycle operations to readers and editors", async () => {
    const input = {
      articleId: "article-1",
      revisionId: "revision-1",
      expectedVersion: 1,
    };
    expect(await service.unpublish(editor, input)).toEqual({ ok: false, code: "forbidden" });
    expect(await service.archive({ ...editor, role: "reader" }, input)).toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(await service.restore(editor, input)).toEqual({ ok: false, code: "forbidden" });
    expect(repository.unpublish).not.toHaveBeenCalled();
    expect(repository.archivePublished).not.toHaveBeenCalled();
    expect(repository.restoreArchived).not.toHaveBeenCalled();
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
