import { describe, expect, it } from "vitest";
import { isValidSiteEditorialTimestamp } from "./site-editorial-actions";

describe("institutional CMS timestamp validation", () => {
  it("accepts valid timezone-aware timestamps", () => {
    expect(isValidSiteEditorialTimestamp("2026-11-28T08:13:00Z")).toBe(true);
    expect(isValidSiteEditorialTimestamp("2024-02-29T12:30:45.123+01:00")).toBe(true);
    expect(isValidSiteEditorialTimestamp("0000-02-29T00:00:00Z")).toBe(true);
  });
  it("rejects impossible dates and clock values", () => {
    for (const value of ["2026-02-31T12:00:00Z", "2026-04-31T12:00:00Z", "2026-01-01T24:00:00Z", "2026-01-01T12:60:00Z", "2026-01-01T12:00:60Z"]) expect(isValidSiteEditorialTimestamp(value)).toBe(false);
  });
  it("rejects absent timezone and invalid offsets", () => {
    for (const value of ["2026-01-01T12:00:00", "2026-01-01T12:00:00+15:00", "2026-01-01T12:00:00+14:01", "2026-01-01T12:00:00+01:60"]) expect(isValidSiteEditorialTimestamp(value)).toBe(false);
  });
  it("rejects non-string and non-ISO inputs", () => {
    for (const value of [null, 42, "January 1, 2026"]) expect(isValidSiteEditorialTimestamp(value)).toBe(false);
  });
});
