import { describe, expect, it } from "vitest";
import {
  NEWS_READ_PAGE_SIZE_MAX,
  NEWS_READ_CURSOR_MAX_LENGTH,
  validateNewsReadQuery,
} from "../src/lib/news-read-query";

describe("validateNewsReadQuery", () => {
  it("rejects malformed top-level payloads", () => {
    for (const payload of [null, undefined, [], "query", 42]) {
      expect(validateNewsReadQuery(payload).ok).toBe(false);
    }
  });

  it("uses safe default page size", () => {
    expect(validateNewsReadQuery({})).toEqual({ ok: true, value: { pageSize: 20 } });
  });

  it("accepts bounded page size and supported filters", () => {
    expect(validateNewsReadQuery({
      pageSize: NEWS_READ_PAGE_SIZE_MAX,
      cursor: "opaque-token",
      status: "in-review",
      category: "official",
      search: " volley ",
    })).toEqual({
      ok: true,
      value: { pageSize: 50, cursor: "opaque-token", status: "in-review", category: "official", search: "volley" },
    });
  });

  it("rejects invalid and unbounded page sizes", () => {
    for (const pageSize of [0, -1, 1.5, "20", NEWS_READ_PAGE_SIZE_MAX + 1, Number.NaN]) {
      expect(validateNewsReadQuery({ pageSize }).ok).toBe(false);
    }
  });

  it("rejects malformed or oversized cursors", () => {
    expect(validateNewsReadQuery({ cursor: "" }).ok).toBe(false);
    expect(validateNewsReadQuery({ cursor: "x".repeat(NEWS_READ_CURSOR_MAX_LENGTH + 1) }).ok).toBe(false);
    expect(validateNewsReadQuery({ cursor: 123 }).ok).toBe(false);
  });

  it("rejects unsupported status and malformed category", () => {
    expect(validateNewsReadQuery({ status: "superuser" }).ok).toBe(false);
    expect(validateNewsReadQuery({ category: " " }).ok).toBe(false);
    expect(validateNewsReadQuery({ category: "x".repeat(61) }).ok).toBe(false);
  });

  it("bounds search text and normalizes whitespace", () => {
    expect(validateNewsReadQuery({ search: "  " })).toEqual({ ok: true, value: { pageSize: 20 } });
    expect(validateNewsReadQuery({ search: " volley " })).toEqual({ ok: true, value: { pageSize: 20, search: "volley" } });
    expect(validateNewsReadQuery({ search: "x".repeat(201) }).ok).toBe(false);
  });
  it("accepts normalized creator and date filters", () => {
    expect(validateNewsReadQuery({ creatorId: " actor-7 ", createdAfter: "2026-01-01", createdBefore: "2026-02-01" })).toEqual({ ok: true, value: { pageSize: 20, creatorId: "actor-7", createdAfter: "2026-01-01T00:00:00.000Z", createdBefore: "2026-02-01T00:00:00.000Z" } });
  });

  it("rejects loosely formatted date strings", () => {
    expect(validateNewsReadQuery({ createdAfter: "March 1, 2026" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-99-99" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-02-31" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-04-31T12:00:00Z" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-01-01T25:00:00Z" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-01-01T12:00:00+99:00" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2024-02-29" }).ok).toBe(true);
    expect(validateNewsReadQuery({ createdAfter: "0000-02-29" }).ok).toBe(true);
    expect(validateNewsReadQuery({ createdAfter: "0099-02-29" }).ok).toBe(false);
  });

  it("rejects malformed creator/date filters and reversed date ranges", () => {
    expect(validateNewsReadQuery({ creatorId: " " }).ok).toBe(false);
    expect(validateNewsReadQuery({ creatorId: "x".repeat(129) }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "not-a-date" }).ok).toBe(false);
    expect(validateNewsReadQuery({ createdAfter: "2026-03-01", createdBefore: "2026-02-01" }).ok).toBe(false);
  });

});
