import { describe, expect, it } from "vitest";
import { isValidNewsReadPageEnvelope } from "../src/lib/news-read-repository";

describe("News read page envelope guard", () => {
  it("accepts bounded page envelopes and nullable cursor", () => {
    expect(isValidNewsReadPageEnvelope({ items: [1, 2], nextCursor: "next" }, 2)).toBe(true);
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 20)).toBe(true);
  });
  it("rejects malformed, oversized or unbounded envelopes", () => {
    for (const payload of [null, [], { items: "not-array", nextCursor: null }, { items: [1, 2, 3], nextCursor: null }, { items: [], nextCursor: " " }, { items: [], nextCursor: "x".repeat(513) }, { items: [], nextCursor: 5 }]) {
      expect(isValidNewsReadPageEnvelope(payload, 2)).toBe(false);
    }
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 51)).toBe(false);
    expect(isValidNewsReadPageEnvelope({ items: [], nextCursor: null }, 0)).toBe(false);
  });
});
