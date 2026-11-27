import { describe, expect, it } from "vitest";
import {
  NEWS_READ_PAGE_SIZE_MAX,
  NEWS_READ_CURSOR_MAX_LENGTH,
  validateNewsReadQuery,
} from "../src/lib/news-read-query";

describe("validateNewsReadQuery", () => {
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
});
