/** Provider-neutral contracts for the future News read repository. No adapter is implemented here. */
import { NEWS_CATEGORIES, type EditorialRevision, type NewsCategory } from "./content-types";
import { NEWS_READ_PAGE_SIZE_MAX, NEWS_READ_CURSOR_MAX_LENGTH, type ValidNewsReadQuery, type ValidNewsPublicListQuery } from "./news-read-query";
import type { NewsDraftContent } from "./server/news-editorial-service";
import { isValidNewsReadOrderRecord } from "./news-read-order";
import { isSafeEditorialImageUrl } from "./editorial-media";

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

/** Public projection: contains only approved content and publication identity/time. */
export interface NewsPublishedArticle {
  articleId: string;
  revisionId: string;
  publishedAt: string;
  content: NewsDraftContent;
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
  /** Must return only current published projections in stable, bounded order. */
  listPublished(query: ValidNewsPublicListQuery): Promise<NewsReadPage<NewsPublishedArticle>>;
  /** Must read only the current published projection, never editorial revisions. */
  getPublishedBySlug(slug: string): Promise<NewsPublishedArticle | null>;
}

/**
 * Contract only: adapters must implement authorization/scope, bounded pagination,
 * deterministic ordering, projection minimization, and atomic publication reads.
 * Never use a client-supplied actor ID as proof of authorization.
 */

const hasExactKeys = (value: object, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

/** Runtime guard for adapter page envelopes; item-specific validation remains separate. */
export function isValidNewsReadPageEnvelope(value: unknown, requestedPageSize: number): value is NewsReadPage<unknown> {
  if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1 || requestedPageSize > NEWS_READ_PAGE_SIZE_MAX) return false;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!hasExactKeys(value, ["items", "nextCursor"])) return false;
  const page = value as Partial<NewsReadPage<unknown>>;
  if (!Array.isArray(page.items) || page.items.length > requestedPageSize) return false;
  if (page.nextCursor !== null && (typeof page.nextCursor !== "string" || !page.nextCursor.trim() || page.nextCursor.length > NEWS_READ_CURSOR_MAX_LENGTH)) return false;
  return true;
}

export function isValidNewsDraftContent(value: unknown): value is NewsDraftContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!hasExactKeys(value, ["title", "slug", "category", "excerpt", "body", "seoTitle", "seoDescription", "imageUrl", "imageAlt"])) return false;
  const content = value as Partial<NewsDraftContent>;
  return typeof content.title === "string" && content.title.trim().length > 0 && content.title.length <= 140
    && typeof content.slug === "string" && content.slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.slug)
    && typeof content.category === "string" && NEWS_CATEGORIES.includes(content.category as NewsCategory)
    && typeof content.excerpt === "string" && content.excerpt.trim().length > 0 && content.excerpt.length <= 300
    && typeof content.body === "string" && content.body.trim().length > 0 && content.body.length <= 20000
    && typeof content.seoTitle === "string" && content.seoTitle.length <= 70
    && typeof content.seoDescription === "string" && content.seoDescription.length <= 160
    && typeof content.imageUrl === "string" && content.imageUrl.length <= 2048
    && (!content.imageUrl.trim() || isSafeEditorialImageUrl(content.imageUrl))
    && typeof content.imageAlt === "string" && content.imageAlt.length <= 200
    && (!content.imageUrl.trim() || content.imageAlt.trim().length > 0);
}

/** Validate the minimal shape of an editorial queue item before consuming adapter data. */
export function isValidNewsReadItem(value: unknown): value is NewsReadItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!hasExactKeys(value, ["articleId", "revisionId", "creatorId", "status", "createdAt", "updatedAt", "content"])) return false;
  const item = value as Partial<NewsReadItem>;
  const statuses = ["draft", "in-review", "approved", "published", "rejected", "archived"];
  if (typeof item.articleId !== "string" || !item.articleId.trim() || item.articleId.length > 128) return false;
  if (typeof item.revisionId !== "string" || !item.revisionId.trim() || item.revisionId.length > 128) return false;
  if (typeof item.creatorId !== "string" || !item.creatorId.trim() || item.creatorId.length > 128) return false;
  if (typeof item.status !== "string" || !statuses.includes(item.status)) return false;
  if (!isValidNewsReadOrderRecord({ id: item.articleId, createdAt: item.createdAt }) || !isValidNewsReadOrderRecord({ id: item.revisionId, createdAt: item.updatedAt })) return false;
  return isValidNewsDraftContent(item.content);
}

/**
 * Public projection is deliberately allow-listed: extra top-level or content keys
 * are rejected so workflow/audit metadata cannot accidentally pass as public data.
 */
export function isValidNewsPublishedArticle(value: unknown): value is NewsPublishedArticle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!hasExactKeys(value, ["articleId", "revisionId", "publishedAt", "content"])) return false;
  const article = value as Partial<NewsPublishedArticle>;
  if (typeof article.articleId !== "string" || !article.articleId.trim() || article.articleId.length > 128) return false;
  if (typeof article.revisionId !== "string" || !article.revisionId.trim() || article.revisionId.length > 128) return false;
  if (!isValidNewsReadOrderRecord({ id: article.articleId, createdAt: article.publishedAt })) return false;
  return isValidNewsDraftContent(article.content);
}
