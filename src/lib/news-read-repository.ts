/** Provider-neutral contracts for the future News read repository. No adapter is implemented here. */
import type { EditorialRevision } from "./content-types";
import { NEWS_READ_PAGE_SIZE_MAX, NEWS_READ_CURSOR_MAX_LENGTH, type ValidNewsReadQuery } from "./news-read-query";
import type { NewsDraftContent } from "./server/news-editorial-service";

export interface NewsReadItem {
  articleId: string;
  revisionId: string;
  content: NewsDraftContent;
  status: EditorialRevision<NewsDraftContent>["status"];
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

export interface NewsReadPage<T> {
  items: T[];
  /** Opaque cursor supplied only by the repository; null means no next page. */
  nextCursor: string | null;
}

export interface NewsRevisionDetail {
  articleId: string;
  revision: EditorialRevision<NewsDraftContent>;
}

export interface NewsReadRepository {
  /** Actor-scoped editorial queue; repository must enforce scope and query filters. */
  listEditorial(actorId: string, query: ValidNewsReadQuery): Promise<NewsReadPage<NewsReadItem>>;
  /** Exact revision lookup; callers must authorize before requesting. */
  getRevision(articleId: string, revisionId: string): Promise<NewsRevisionDetail | null>;
  /** Stable, bounded revision history for one article. */
  listRevisionHistory(articleId: string, query: Pick<ValidNewsReadQuery, "pageSize" | "cursor">): Promise<NewsReadPage<NewsRevisionDetail>>;
  /** Audit reads must be restricted to authorized publisher/admin actors. */
  listAudit(articleId: string, query: Pick<ValidNewsReadQuery, "pageSize" | "cursor">): Promise<NewsReadPage<unknown>>;
  /** Public route must return only the currently published projection. */
  getPublishedBySlug(slug: string): Promise<NewsDraftContent | null>;
}

/**
 * Contract only: adapters must implement authorization/scope, bounded pagination,
 * deterministic ordering, projection minimization, and atomic publication reads.
 * Never use a client-supplied actor ID as proof of authorization.
 */

/** Runtime guard for adapter page envelopes; item-specific validation remains separate. */
export function isValidNewsReadPageEnvelope(value: unknown, requestedPageSize: number): value is NewsReadPage<unknown> {
  if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1 || requestedPageSize > NEWS_READ_PAGE_SIZE_MAX) return false;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const page = value as Partial<NewsReadPage<unknown>>;
  if (!Array.isArray(page.items) || page.items.length > requestedPageSize) return false;
  if (page.nextCursor !== null && (typeof page.nextCursor !== "string" || !page.nextCursor.trim() || page.nextCursor.length > NEWS_READ_CURSOR_MAX_LENGTH)) return false;
  return true;
}
