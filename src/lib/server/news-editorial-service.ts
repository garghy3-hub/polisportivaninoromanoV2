import type { NewsCategory, EditorialRevision } from "../content-types";
import type { EditorialActor } from "../editorial-session";
import type { NewsDraftInput, NewsDraftIssue } from "../news-draft-validation";
import { validateNewsDraft } from "../news-draft-validation";

export type NewsDraftContent = Pick<
  NewsDraftInput,
  "title" | "slug" | "category" | "excerpt" | "body" | "seoTitle" | "seoDescription"
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
}

const toDraftInput = (content: NewsDraftContent): NewsDraftInput => ({
  ...content,
  imageUrl: "",
  imageAlt: "",
});

export function createNewsEditorialService(
  repository: NewsEditorialRepository,
  allowedCategories: readonly NewsCategory[],
): NewsEditorialService {
  const validate = (content: NewsDraftContent): NewsDraftIssue[] =>
    validateNewsDraft(toDraftInput(content), allowedCategories);

  const authorize = (
    actor: EditorialActor | null,
    permission: "create-content" | "edit-content" | "submit-for-review",
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
      const issues = validate(content);
      if (issues.length) return { ok: false, code: "invalid", issues };
      return repository.createDraft({ actor: actor!, content });
    },

    async updateDraft(actor, input) {
      const denied = authorize(actor, "edit-content");
      if (denied) return denied;
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
      return repository.updateDraft({ ...input, actor: actor! });
    },

    async submitForReview(actor, input) {
      const denied = authorize(actor, "submit-for-review");
      if (denied) return denied;
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
      return repository.submitForReview({ ...input, actor: actor! });
    },
  };
}

function actorHasPermission(
  actor: EditorialActor,
  permission: "create-content" | "edit-content" | "submit-for-review",
): boolean {
  // Importing the shared pure policy keeps this service fail-closed.
  return hasEditorialPermission(actor.role, permission);
}

import { hasEditorialPermission } from "../editorial-permissions";

function isValidRevisionTarget(articleId: string, revisionId: string): boolean {
  return [articleId, revisionId].every(
    value => typeof value === "string" && value.trim().length > 0 && value.length <= 128,
  );
}
