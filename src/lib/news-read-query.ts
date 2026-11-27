/** Bounded, provider-neutral read-query validation for future News adapters. */

export const NEWS_READ_PAGE_SIZE_MAX = 50;
export const NEWS_READ_PAGE_SIZE_DEFAULT = 20;
export const NEWS_READ_CURSOR_MAX_LENGTH = 512;

export type NewsReadStatus = "draft" | "in-review" | "approved" | "rejected" | "published" | "archived";

export interface NewsReadQueryInput {
  pageSize?: unknown; cursor?: unknown; status?: unknown; category?: unknown; search?: unknown;
  creatorId?: unknown; createdAfter?: unknown; createdBefore?: unknown;
}
export interface ValidNewsReadQuery {
  pageSize: number; cursor?: string; status?: NewsReadStatus; category?: string; search?: string;
  creatorId?: string; createdAfter?: string; createdBefore?: string;
}
export type NewsReadQueryValidation =
  | { ok: true; value: ValidNewsReadQuery }
  | { ok: false; issues: string[] };

const statuses: NewsReadStatus[] = ["draft", "in-review", "approved", "rejected", "published", "archived"];

export function validateNewsReadQuery(input: unknown): NewsReadQueryValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, issues: ["query must be an object."] };
  }
  const query = input as NewsReadQueryInput;
  const issues: string[] = [];
  let pageSize = NEWS_READ_PAGE_SIZE_DEFAULT;
  if (query.pageSize !== undefined) {
    if (typeof query.pageSize !== "number" || !Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > NEWS_READ_PAGE_SIZE_MAX) {
      issues.push(`pageSize must be an integer between 1 and ${NEWS_READ_PAGE_SIZE_MAX}.`);
    } else pageSize = query.pageSize;
  }
  let cursor: string | undefined;
  if (query.cursor !== undefined) {
    if (typeof query.cursor !== "string" || !query.cursor.trim() || query.cursor.length > NEWS_READ_CURSOR_MAX_LENGTH) issues.push("cursor must be a non-empty bounded string.");
    else cursor = query.cursor;
  }
  let status: NewsReadStatus | undefined;
  if (query.status !== undefined) {
    if (typeof query.status !== "string" || !statuses.includes(query.status as NewsReadStatus)) issues.push("status is not recognized.");
    else status = query.status as NewsReadStatus;
  }
  let category: string | undefined;
  if (query.category !== undefined) {
    if (typeof query.category !== "string" || !query.category.trim() || query.category.length > 60) issues.push("category must be a non-empty string of at most 60 characters.");
    else category = query.category.trim();
  }
  let creatorId: string | undefined;
  if (query.creatorId !== undefined) {
    if (typeof query.creatorId !== "string" || !query.creatorId.trim() || query.creatorId.length > 128) issues.push("creatorId must be a non-empty string of at most 128 characters.");
    else creatorId = query.creatorId.trim();
  }
  const parseDate = (value: unknown, field: "createdAfter" | "createdBefore"): string | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value.trim()) || !Number.isFinite(Date.parse(value))) {
      issues.push(`${field} must be a valid ISO date or date-time.`);
      return undefined;
    }
    return new Date(Date.parse(value)).toISOString();
  };
  const createdAfter = parseDate(query.createdAfter, "createdAfter");
  const createdBefore = parseDate(query.createdBefore, "createdBefore");
  if (createdAfter && createdBefore && Date.parse(createdAfter) > Date.parse(createdBefore)) issues.push("createdAfter must not be later than createdBefore.");
  let search: string | undefined;
  if (query.search !== undefined) {
    if (typeof query.search !== "string" || query.search.length > 200) issues.push("search must be a string of at most 200 characters.");
    else if (query.search.trim()) search = query.search.trim();
  }
  return issues.length ? { ok: false, issues } : {
    ok: true, value: { pageSize, ...(cursor ? { cursor } : {}), ...(status ? { status } : {}),
      ...(category ? { category } : {}), ...(search ? { search } : {}), ...(creatorId ? { creatorId } : {}),
      ...(createdAfter ? { createdAfter } : {}), ...(createdBefore ? { createdBefore } : {}) },
  };
}
