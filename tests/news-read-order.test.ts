import { describe, expect, it } from "vitest";
import { compareNewsReadOrder, isValidNewsReadOrderRecord, sortNewsReadRecords } from "../src/lib/news-read-order";

describe("News read ordering", () => {
  it("validates ordering fields fail-closed", () => {
    expect(isValidNewsReadOrderRecord({ id: "x", createdAt: "2026-01-01T00:00:00Z" })).toBe(true);
    expect(isValidNewsReadOrderRecord({ id: " ", createdAt: "2026-01-01T00:00:00Z" })).toBe(false);
    expect(isValidNewsReadOrderRecord({ id: "x", createdAt: "invalid" })).toBe(false);
    expect(isValidNewsReadOrderRecord(null)).toBe(false);
    expect(isValidNewsReadOrderRecord([])).toBe(false);
    expect(isValidNewsReadOrderRecord({ id: "x".repeat(129), createdAt: "2026-01-01T00:00:00Z" })).toBe(false);
  });

  it("throws instead of silently sorting malformed records", () => {
    expect(() => sortNewsReadRecords([{ id: "x", createdAt: "invalid" }])).toThrow(TypeError);
  });

  it("orders newest records first", () => {
    const records = [
      { id: "a", createdAt: "2026-01-01T10:00:00Z" },
      { id: "b", createdAt: "2026-01-02T10:00:00Z" },
      { id: "c", createdAt: "2026-01-01T11:00:00Z" },
    ];
    expect(sortNewsReadRecords(records).map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("uses ascending stable IDs for timestamp ties", () => {
    expect(compareNewsReadOrder(
      { id: "b", createdAt: "2026-01-02T10:00:00Z" },
      { id: "a", createdAt: "2026-01-02T10:00:00Z" },
    )).toBeGreaterThan(0);
    expect(sortNewsReadRecords([
      { id: "z", createdAt: "2026-01-02T10:00:00Z" },
      { id: "a", createdAt: "2026-01-02T10:00:00Z" },
    ]).map((r) => r.id)).toEqual(["a", "z"]);
  });

  it("does not mutate the input array", () => {
    const records = [{ id: "b", createdAt: "2026-01-01T00:00:00Z" }, { id: "a", createdAt: "2026-01-02T00:00:00Z" }];
    const original = [...records];
    sortNewsReadRecords(records);
    expect(records).toEqual(original);
  });
});
