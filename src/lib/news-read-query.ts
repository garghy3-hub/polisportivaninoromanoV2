/** Bounded, provider-neutral read-query validation for future News adapters. */

export const NEWS_READ_PAGE_SIZE_MAX = 50;
export const NEWS_READ_PAGE_SIZE_DEFAULT = 20;
export const NEWS_READ_CURSOR_MAX_LENGTH = 512;

export type NewsReadStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export interface NewsReadQueryInput {
  pageSize?: unknown;
  cursor?: unknown;
  status?: unknown;
  category?: unknown;
  search?: unknown;
  creatorId?: unknown;
  createdAfter?: unknown;
  createdBefore?: unknown;
}

export interface ValidNewsReadQuery {
  pageSize: number;
  cursor?: string;
  status?: NewsReadStatus;
  category?: string;
  search?: string;
  creatorId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export type NewsReadQueryValidation =
  | { ok: true; value: ValidNewsReadQuery }
  | { ok: false; issues: string[] };

const statuses: NewsReadStatus[] = [
  "draft", "in-review", "approved", "rejected", "published", "archived",
];

export function validateNewsReadQuery(input: NewsReadQueryInput): NewsReadQueryValidation {
  const issues: string[] = [];
  let pageSize = NEWS_READ_PAGE_SIZE_DEFAULT;

  if (input.pageSize !== undefined) {
    if (typeof input.pageSize !== "number" || !Number.isInteger(input.pageSize) || input.pageSize < 1) {
      issues.push("pageSize must be a positive integer.");
    } else if (input.pageSize > NEWS_READ_PAGE_SIZE_MAX) {
      issues.push(`pageSize must not exceed ${NEWS_READ_PAGE_SIZE_MAX}.`);
    } else {
      pageSize = input.pageSize;
    }
  }

  let cursor: string | undefined;
  if (input.cursor !== undefined) {
    if (typeof input.cursor !== "string" || !input.cursor.trim() || input.cursor.length > NEWS_READ_CURSOR_MAX_LENGTH) {
      issues.push("cursor must be a non-empty bounded string.");
    } else {
      cursor = input.cursor;
    }
  }

  let status: NewsReadStatus | undefined;
  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !statuses.includes(input.status as NewsReadStatus)) {
      issues.push("status is not recognized.");
    } else {
      status = input.status as NewsReadStatus;
    }
  }

  let category: string | undefined;
  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !input.category.trim() || input.category.length > 60) {
      issues.push("category must be a non-empty string of at most 60 characters.");
    } else {
      category = input.category.trim();
    }
  }

  let creatorId: string | undefined;
  if (input.creatorId !== undefined) {
    if (typeof input.creatorId !== 'string' || !input.creatorId.trim() || input.creatorId.length > 128) {
      issues.push('creatorId must be a non-empty string of at most 128 characters.');
    } else { creatorId = input.creatorId.trim(); }
  }

  const parseDateFilter = (value: unknown, field: 'createdAfter' | 'createdBefore'): string | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Date.parse(value))) {
      issues.push(`${field} must be a valid date string.`);
      return undefined;
    }
    return new Date(Date.parse(value)).toISOString();
  };
  const createdAfter = parseDateFilter(input.createdAfter, 'createdAfter');
  const createdBefore = parseDateFilter(input.createdBefore, 'createdBefore');
  if (createdAfter && createdBefore && Date.parse(createdAfter) > Date.parse(createdBefore)) {
    issues.push('createdAfter must not be later than createdBefore.');
  }

  let search: string | undefined;
  if (input.search !== undefined) {
    if (typeof input.search !== "string" || input.search.length > 200) {
      issues.push("search must be a string of at most 200 characters.");
    } else if (input.search.trim()) {
      search = input.search.trim();
    }
  }

  return issues.length
    ? { ok: false, issues }
    : { ok: true, value: { pageSize, ...(cursor ? { cursor } : {}), ...(status ? { status } : {}), ...(category ? { category } : {}), ...(search ? { search } : {}), ...(creatorId ? { creatorId } : {}), ...(createdAfter ? { createdAfter } : {}), ...(createdBefore ? { createdBefore } : {}) } };
}
