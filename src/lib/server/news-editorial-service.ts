import type { NewsCategory, EditorialRevision } from "../content-types";
import type { EditorialActor } from "../editorial-session";
import type { NewsDraftInput, NewsDraftIssue } from "../news-draft-validation";
import { validateNewsDraft } from "../news-draft-validation";
import { canTransitionRevision, hasEditorialPermission } from "../editorial-permissions";

export type NewsDraftContent = Pick<
  NewsDraftInput,
  "title" | "slug" | "category" | "excerpt" | "body" | "seoTitle" | "seoDescription" | "imageUrl" | "imageAlt"
>;

export interface NewsRevisionRecord {
  revision: EditorialRevision<NewsDraftContent>;
  version: number;
}

export type NewsRepositoryFailureCode =
  | "not-found"
  | "conflict"
  | "slug-taken"
  | "invalid-transition"
  | "internal";

export type NewsRepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: NewsRepositoryFailureCode; message?: string };

export interface NewsEditorialRepository {
  /**
   * Must atomically create article identity, draft revision and audit event.
   * IDs, timestamps and actor attribution are generated/derived server-side.
   */
  createDraft(input: {
    content: NewsDraftContent;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /**
   * Must enforce draft/rejected editability, ownership/scope, slug uniqueness,
   * expectedVersion and audit append in one transaction.
   */
  updateDraft(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    content: NewsDraftContent;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /**
   * Must atomically transition draft -> in-review, freeze the revision and
   * append an audit event. The actor and timestamp are server-derived.
   */
  submitForReview(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /**
   * Must verify the current state/version, write reviewer metadata and audit
   * atomically. A rejection note is mandatory; the repository never trusts a
   * target state supplied outside this constrained decision. It must enforce
   * separation of duties by preventing the revision creator from reviewing
   * their own submission.
   */
  reviewDecision(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    decision: "approved" | "rejected";
    reviewNote?: string;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /**
   * Must publish only the approved revision, generate publication timestamps
   * server-side, update the public projection and append audit atomically.
   */
  publishApproved(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /** Atomically remove the public projection, return revision to draft and audit. */
  unpublish(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /** Atomically remove the public projection, archive the revision and audit. */
  archivePublished(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;

  /** Restore an archived revision to draft without making it public. */
  restoreArchived(input: {
    articleId: string;
    revisionId: string;
    expectedVersion: number;
    actor: EditorialActor;
  }): Promise<NewsRepositoryResult<NewsRevisionRecord>>;
}

export type NewsEditorialFailureCode =
  | "unauthenticated"
  | "forbidden"
  | "invalid"
  | NewsRepositoryFailureCode;

export type NewsEditorialResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: NewsEditorialFailureCode;
      issues?: NewsDraftIssue[];
      message?: string;
    };

export interface NewsEditorialService {
  createDraft(
    actor: EditorialActor | null,
    content: NewsDraftContent,
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  updateDraft(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
      content: NewsDraftContent;
    },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  submitForReview(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
    },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  approve(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
      reviewNote?: string;
    },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  reject(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
      reviewNote: string;
    },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  publish(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
    },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  unpublish(
    actor: EditorialActor | null,
    input: { articleId: string; revisionId: string; expectedVersion: number },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  archive(
    actor: EditorialActor | null,
    input: { articleId: string; revisionId: string; expectedVersion: number },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
  restore(
    actor: EditorialActor | null,
    input: { articleId: string; revisionId: string; expectedVersion: number },
  ): Promise<NewsEditorialResult<NewsRevisionRecord>>;
}

const toDraftInput = (content: NewsDraftContent): NewsDraftInput => ({
  ...content,
});

/**
 * Construct this service only inside a trusted server request boundary.
 * The actor argument must come from resolveEditorialActor() after a trusted
 * authentication adapter verifies the session. Never pass an actor, role or
 * session record supplied by a browser payload. This module is not itself an
 * HTTP endpoint, authentication mechanism or persistence implementation.
 */
export function createNewsEditorialService(
  repository: NewsEditorialRepository,
  allowedCategories: readonly NewsCategory[],
): NewsEditorialService {
  const validate = (content: NewsDraftContent): NewsDraftIssue[] =>
    validateNewsDraft(toDraftInput(content), allowedCategories);

  const authorize = (
    actor: EditorialActor | null,
    permission:
      | "create-content"
      | "edit-content"
      | "submit-for-review"
      | "approve-content"
      | "reject-content"
      | "publish-content"
      | "unpublish-content"
      | "archive-content"
      | "restore-content",
  ): NewsEditorialResult<never> | null => {
    if (!actor) return { ok: false, code: "unauthenticated" };
    if (!actorHasPermission(actor, permission)) {
      return { ok: false, code: "forbidden" };
    }
    return null;
  };

  return {
    async createDraft(actor, content) {
      const denied = authorize(actor, "create-content");
      if (denied) return denied;
      if (!hasExactKeys(content, ["title", "slug", "category", "excerpt", "body", "seoTitle", "seoDescription", "imageUrl", "imageAlt"])) {
        return { ok: false, code: "invalid", message: "Il contenuto contiene campi mancanti o non riconosciuti." };
      }
      const issues = validate(content);
      if (issues.length) return { ok: false, code: "invalid", issues };
      return callRepository(() => repository.createDraft({ actor: actor!, content }));
    },

    async updateDraft(actor, input) {
      const denied = authorize(actor, "edit-content");
      if (denied) return denied;
      if (!input || typeof input !== "object" || Array.isArray(input)
        || !hasExactKeys(input, ["articleId", "revisionId", "expectedVersion", "content"])) {
        return { ok: false, code: "invalid", message: "Dati della revisione non validi o contenenti campi non riconosciuti." };
      }
      if (!hasExactKeys(input.content, ["title", "slug", "category", "excerpt", "body", "seoTitle", "seoDescription", "imageUrl", "imageAlt"])) {
        return { ok: false, code: "invalid", message: "Il contenuto contiene campi mancanti o non riconosciuti." };
      }
      const issues = validate(input.content);
      if (issues.length) return { ok: false, code: "invalid", issues };
      if (
        !isValidRevisionTarget(input.articleId, input.revisionId) ||
        !Number.isInteger(input.expectedVersion) ||
        input.expectedVersion < 1
      ) {
        return {
          ok: false,
          code: "invalid",
          message: "Valid article and revision IDs plus a positive expected version are required.",
        };
      }
      return callRepository(() => repository.updateDraft({ ...input, actor: actor! }));
    },

    async submitForReview(actor, input) {
      const denied = authorize(actor, "submit-for-review");
      if (denied) return denied;
      const invalid = validateRevisionCommand(input);
      if (invalid) return invalid;
      return callRepository(() => repository.submitForReview({ ...input, actor: actor! }));
    },

    async approve(actor, input) {
      return review(actor, input, "approved");
    },

    async reject(actor, input) {
      return review(actor, input, "rejected");
    },

    async publish(actor, input) {
      const denied = authorize(actor, "publish-content");
      if (denied) return denied;
      const invalid = validateRevisionCommand(input);
      if (invalid) return invalid;
      if (!canTransitionRevision(actor!.role, "approved", "published")) {
        return { ok: false, code: "forbidden" };
      }
      return callRepository(() => repository.publishApproved({ ...input, actor: actor! }));
    },

    async unpublish(actor, input) {
      const denied = authorize(actor, "unpublish-content");
      if (denied) return denied;
      const invalid = validateRevisionCommand(input);
      if (invalid) return invalid;
      if (!canTransitionRevision(actor!.role, "published", "draft")) {
        return { ok: false, code: "forbidden" };
      }
      return callRepository(() => repository.unpublish({ ...input, actor: actor! }));
    },

    async archive(actor, input) {
      const denied = authorize(actor, "archive-content");
      if (denied) return denied;
      const invalid = validateRevisionCommand(input);
      if (invalid) return invalid;
      if (!canTransitionRevision(actor!.role, "published", "archived")) {
        return { ok: false, code: "forbidden" };
      }
      return callRepository(() => repository.archivePublished({ ...input, actor: actor! }));
    },

    async restore(actor, input) {
      const denied = authorize(actor, "restore-content");
      if (denied) return denied;
      const invalid = validateRevisionCommand(input);
      if (invalid) return invalid;
      if (!canTransitionRevision(actor!.role, "archived", "draft")) {
        return { ok: false, code: "forbidden" };
      }
      return callRepository(() => repository.restoreArchived({ ...input, actor: actor! }));
    },
  };

  function review(
    actor: EditorialActor | null,
    input: {
      articleId: string;
      revisionId: string;
      expectedVersion: number;
      reviewNote?: string;
    },
    decision: "approved" | "rejected",
  ): Promise<NewsEditorialResult<NewsRevisionRecord>> {
    const permission = decision === "approved" ? "approve-content" : "reject-content";
    const denied = authorize(actor, permission);
    if (denied) return Promise.resolve(denied);
    const invalid = validateRevisionCommand(input);
    if (invalid) return Promise.resolve(invalid);
    if (input.reviewNote !== undefined && typeof input.reviewNote !== "string") {
      return Promise.resolve({
        ok: false,
        code: "invalid",
        message: "La nota di revisione deve essere un testo valido.",
      });
    }
    const note = input.reviewNote?.trim();
    if (decision === "rejected" && !note) {
      return Promise.resolve({
        ok: false,
        code: "invalid",
        message: "Una motivazione è obbligatoria per rifiutare la revisione.",
      });
    }
    if (input.reviewNote !== undefined && input.reviewNote.length > 1000) {
      return Promise.resolve({
        ok: false,
        code: "invalid",
        message: "La nota di revisione non può superare 1000 caratteri.",
      });
    }
    if (!canTransitionRevision(actor!.role, "in-review", decision)) {
      return Promise.resolve({ ok: false, code: "forbidden" });
    }
    return callRepository(() => repository.reviewDecision({
      articleId: input.articleId,
      revisionId: input.revisionId,
      expectedVersion: input.expectedVersion,
      decision,
      ...(note ? { reviewNote: note } : {}),
      actor: actor!,
    }));
  }
}

function validateRevisionCommand(input: unknown, allowReviewNote = false): NewsEditorialResult<never> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      code: "invalid",
      message: "Identificativi di articolo e revisione validi e versione attesa positiva sono obbligatori.",
    };
  }
  const command = input as { articleId?: unknown; revisionId?: unknown; expectedVersion?: unknown };
  const requiredKeys = ["articleId", "revisionId", "expectedVersion"];
  const allowedKeys = allowReviewNote ? [...requiredKeys, "reviewNote"] : requiredKeys;
  const actualKeys = Object.keys(input);
  if (!requiredKeys.every(key => actualKeys.includes(key)) || actualKeys.some(key => !allowedKeys.includes(key))) {
    return {
      ok: false,
      code: "invalid",
      message: "Il comando contiene campi non riconosciuti.",
    };
  }
  if (
    !isValidRevisionTarget(command.articleId as string, command.revisionId as string) ||
    !Number.isInteger(command.expectedVersion) ||
    (command.expectedVersion as number) < 1
  ) {
    return {
      ok: false,
      code: "invalid",
      message: "Identificativi di articolo e revisione validi e versione attesa positiva sono obbligatori.",
    };
  }
  return null;
}

function actorHasPermission(
  actor: EditorialActor,
  permission:
    | "create-content"
    | "edit-content"
    | "submit-for-review"
    | "approve-content"
    | "reject-content"
    | "publish-content"
    | "unpublish-content"
    | "archive-content"
    | "restore-content",
): boolean {
  return hasEditorialPermission(actor.role, permission);
}

function isValidRevisionTarget(articleId: string, revisionId: string): boolean {
  return [articleId, revisionId].every(
    value => typeof value === "string" && value.trim().length > 0 && value.length <= 128,
  );
}


/**
 * Persistence failures are deliberately normalized: adapter errors may
 * contain SQL, storage details or other internals and must never reach clients.
 */
async function callRepository<T>(
  operation: () => Promise<NewsRepositoryResult<T>>,
): Promise<NewsEditorialResult<T>> {
  try {
    return await operation();
  } catch {
    return {
      ok: false,
      code: "internal",
      message: "Operazione editoriale non riuscita. Riprova o contatta un amministratore.",
    };
  }
}

function hasExactKeys(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
