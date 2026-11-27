/** Bounded, provider-neutral read-query validation for future News adapters. */
import { NEWS_CATEGORIES, type NewsCategory } from "./content-types";

export const NEWS_READ_PAGE_SIZE_MAX = 50;
export const NEWS_READ_PAGE_SIZE_DEFAULT = 20;
export const NEWS_READ_CURSOR_MAX_LENGTH = 512;

export type NewsReadStatus = "draft" | "in-review" | "approved" | "rejected" | "published" | "archived";

export interface NewsReadQueryInput {
  pageSize?: unknown; cursor?: unknown; status?: unknown; category?: unknown; search?: unknown;
  creatorId?: unknown; createdAfter?: unknown; createdBefore?: unknown;
}
export interface ValidNewsReadQuery {
  pageSize: number; cursor?: string; status?: NewsReadStatus; category?: NewsCategory; search?: string;
  creatorId?: string; createdAfter?: string; createdBefore?: string;
}
export type NewsReadQueryValidation =
  | { ok: true; value: ValidNewsReadQuery }
  | { ok: false; issues: string[] };

const statuses: NewsReadStatus[] = ["draft", "in-review", "approved", "rejected", "published", "archived"];
const allowedQueryKeys = new Set([
  "pageSize", "cursor", "status", "category", "search", "creatorId", "createdAfter", "createdBefore",
]);

export function validateNewsReadQuery(input: unknown): NewsReadQueryValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, issues: ["query must be an object."] };
  }
  const query = input as NewsReadQueryInput;
  const issues: string[] = [];
  for (const key of Object.keys(input)) {
    if (!allowedQueryKeys.has(key)) issues.push(`unexpected query field: ${key}.`);
  }
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
  let category: NewsCategory | undefined;
  if (query.category !== undefined) {
    if (typeof query.category !== "string" || !query.category.trim() || query.category.length > 60) issues.push("category must be a non-empty string of at most 60 characters.");
    else if (!NEWS_CATEGORIES.includes(query.category.trim() as NewsCategory)) issues.push("category is not recognized.");
    else category = query.category.trim() as NewsCategory;
  }
  let creatorId: string | undefined;
  if (query.creatorId !== undefined) {
    if (typeof query.creatorId !== "string" || !query.creatorId.trim() || query.creatorId.length > 128) issues.push("creatorId must be a non-empty string of at most 128 characters.");
    else creatorId = query.creatorId.trim();
  }
  const parseDate = (value: unknown, field: "createdAfter" | "createdBefore"): string | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== "string") {
      issues.push(`${field} must be a valid ISO date or date-time.`);
      return undefined;
    }
    const normalized = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(normalized);
    if (!match) {
      issues.push(`${field} must be a valid ISO date or date-time.`);
      return undefined;
    }
    const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
    const year = Number(yearText), month = Number(monthText), day = Number(dayText);
    const hour = hourText === undefined ? 0 : Number(hourText);
    const minute = minuteText === undefined ? 0 : Number(minuteText);
    const second = secondText === undefined ? 0 : Number(secondText);
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
    const zoneMatch = zone && zone !== "Z" ? /[+-](\d{2}):(\d{2})$/.exec(zone) : null;
    const zoneValid = !zoneMatch || (Number(zoneMatch[1]) <= 23 && Number(zoneMatch[2]) <= 59);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59 || !zoneValid || !Number.isFinite(Date.parse(normalized))) {
      issues.push(`${field} must be a valid ISO date or date-time.`);
      return undefined;
    }
    return new Date(Date.parse(normalized)).toISOString();
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
