/**
 * Provider-neutral, fail-closed read facade for the News editorial workflow.
 *
 * Server-only usage: callers must resolve a verified session and authorize
 * each operation before invoking this service. actorId is a scope key, not
 * proof of identity. The repository must independently enforce scope.
 */
import {
  isValidNewsDraftContent,
  isValidNewsPublishedArticle,
  isValidNewsReadItem,
  isValidNewsReadPageEnvelope,
  type NewsPublishedArticle,
  type NewsReadItem,
  type NewsReadPage,
  type NewsReadRepository,
  type NewsRevisionDetail,
} from "./news-read-repository";
import { validateNewsPublicListQuery, validateNewsReadQuery, type ValidNewsReadQuery } from "./news-read-query";
import { isValidNewsReadOrderRecord } from "./news-read-order";

export type NewsReadFailureCode = "invalid" | "internal";
export type NewsReadResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: NewsReadFailureCode; message: string; issues?: string[] };

export interface NewsReadService {
  listEditorial(actorId: string, query: unknown): Promise<NewsReadResult<NewsReadPage<NewsReadItem>>>;
  getRevision(articleId: string, revisionId: string): Promise<NewsReadResult<NewsRevisionDetail | null>>;
  listRevisionHistory(articleId: string, query: unknown): Promise<NewsReadResult<NewsReadPage<NewsRevisionDetail>>>;
  listAudit(articleId: string, query: unknown): Promise<NewsReadResult<NewsReadPage<unknown>>>;
  listPublished(query: unknown): Promise<NewsReadResult<NewsReadPage<NewsPublishedArticle>>>;\n  getPublishedBySlug(slug: string): Promise<NewsReadResult<NewsPublishedArticle | null>>;
}

const INTERNAL_MESSAGE = "Impossibile recuperare i contenuti. Riprova o contatta un amministratore.";
const INVALID_MESSAGE = "I parametri della richiesta non sono validi.";

export function createNewsReadService(repository: NewsReadRepository): NewsReadService {
  return {
    async listEditorial(actorId, query) {
      if (!validId(actorId)) return invalid(["actorId non valido."]);
      const parsed = validateNewsReadQuery(query);
      if (!parsed.ok) return invalid(parsed.issues);
      return run(async () => {
        const page = await repository.listEditorial(actorId, parsed.value);
        if (!isValidNewsReadPageEnvelope(page, parsed.value.pageSize) || !page.items.every(isValidNewsReadItem)) return failure();
        return success(page as NewsReadPage<NewsReadItem>);
      });
    },

    async getRevision(articleId, revisionId) {
      if (!validId(articleId) || !validId(revisionId)) return invalid(["Identificativi non validi."]);
      return run(async () => {
        const detail = await repository.getRevision(articleId, revisionId);
        if (detail === null) return success(null);
        return isValidRevisionDetail(detail) && detail.articleId === articleId && detail.revision.id === revisionId
          ? success(detail) : failure();
      });
    },

    async listRevisionHistory(articleId, query) {
      if (!validId(articleId)) return invalid(["Identificativo articolo non valido."]);
      const parsed = validateHistoryQuery(query);
      if (!parsed.ok) return invalid(parsed.issues);
      return run(async () => {
        const page = await repository.listRevisionHistory(articleId, parsed.value);
        if (!isValidNewsReadPageEnvelope(page, parsed.value.pageSize)
          || !page.items.every(item => isValidRevisionDetail(item) && item.articleId === articleId)) return failure();
        return success(page as NewsReadPage<NewsRevisionDetail>);
      });
    },

    async listAudit(articleId, query) {
      if (!validId(articleId)) return invalid(["Identificativo articolo non valido."]);
      const parsed = validateHistoryQuery(query);
      if (!parsed.ok) return invalid(parsed.issues);
      return run(async () => {
        const page = await repository.listAudit(articleId, parsed.value);
        if (!isValidNewsReadPageEnvelope(page, parsed.value.pageSize)) return failure();
        return success(page);
      });
    },

    async listPublished(query) {
      const parsed = validateNewsPublicListQuery(query);
      if (!parsed.ok) return invalid(parsed.issues);
      return run(async () => {
        const page = await repository.listPublished(parsed.value);
        if (!isValidNewsReadPageEnvelope(page, parsed.value.pageSize)
          || !page.items.every(isValidNewsPublishedArticle)) return failure();
        const articleIds = page.items.map(item => item.articleId);
        const slugs = page.items.map(item => item.content.slug);
        if (new Set(articleIds).size !== articleIds.length || new Set(slugs).size !== slugs.length) return failure();
        return success(page as NewsReadPage<NewsPublishedArticle>);
      });
    },

    async getPublishedBySlug(slug) {
      if (typeof slug !== "string" || slug.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return invalid(["Slug non valido."]);
      }
      return run(async () => {
        const article = await repository.getPublishedBySlug(slug);
        if (article === null) return success(null);
        return isValidNewsPublishedArticle(article) && article.content.slug === slug ? success(article) : failure();
      });
    },
  };
}

function validateHistoryQuery(query: unknown):
  | { ok: true; value: Pick<ValidNewsReadQuery, "pageSize" | "cursor"> }
  | { ok: false; issues: string[] } {
  const parsed = validateNewsReadQuery(query);
  if (!parsed.ok) return parsed;
  const { pageSize, cursor } = parsed.value;
  if (Object.keys(parsed.value).some(key => key !== "pageSize" && key !== "cursor")) {
    return { ok: false, issues: ["La cronologia accetta solo pageSize e cursor."] };
  }
  return { ok: true, value: { pageSize, ...(cursor ? { cursor } : {}) } };
}

function isValidRevisionDetail(value: unknown): value is NewsRevisionDetail {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const detail = value as Record<string, unknown>;
  if (Object.keys(detail).length !== 2 || !Object.hasOwn(detail, "articleId") || !Object.hasOwn(detail, "revision")) return false;
  if (!validId(detail.articleId)) return false;
  const revision = detail.revision as Record<string, unknown> | null;
  if (!revision || typeof revision !== "object" || Array.isArray(revision)) return false;
  const required = ["id", "entityType", "entityId", "status", "content", "createdAt", "createdBy", "updatedAt", "updatedBy"];
  const optional = ["reviewerId", "reviewedAt", "reviewNote", "publishedAt"];
  if (required.some(key => !Object.hasOwn(revision, key)) || Object.keys(revision).some(key => ![...required, ...optional].includes(key))) return false;
  if (revision.entityType !== "article" || revision.entityId !== detail.articleId || !validId(revision.id)) return false;
  if (!["draft", "in-review", "approved", "rejected", "published", "archived"].includes(String(revision.status))) return false;
  if (!["createdAt", "updatedAt"].every(key => isValidNewsReadOrderRecord({ id: String(revision.id), createdAt: revision[key] }))) return false;
  if (!["createdBy", "updatedBy"].every(key => validId(revision[key]))) return false;
  if (revision.reviewerId !== undefined && !validId(revision.reviewerId)) return false;
  if (revision.reviewedAt !== undefined && !isValidNewsReadOrderRecord({ id: String(revision.id), createdAt: revision.reviewedAt })) return false;
  if (revision.publishedAt !== undefined && !isValidNewsReadOrderRecord({ id: String(revision.id), createdAt: revision.publishedAt })) return false;
  if (revision.reviewNote !== undefined && (typeof revision.reviewNote !== "string" || revision.reviewNote.length > 1000)) return false;
  return isValidNewsDraftContent(revision.content);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 128;
}

async function run<T>(operation: () => Promise<NewsReadResult<T>>): Promise<NewsReadResult<T>> {
  try {
    const result = await operation();
    return result && typeof result === "object" ? result : failure();
  } catch {
    return failure();
  }
}
function success<T>(value: T): NewsReadResult<T> { return { ok: true, value }; }
function failure(): NewsReadResult<never> { return { ok: false, code: "internal", message: INTERNAL_MESSAGE }; }
function invalid(issues: string[]): NewsReadResult<never> { return { ok: false, code: "invalid", message: INVALID_MESSAGE, issues }; }
