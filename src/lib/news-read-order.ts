/** Stable ordering primitive for News read adapters (newest first, ID tie-breaker). */
export interface NewsReadOrderRecord {
  createdAt: string;
  id: string;
}

/** Compare records by parsed creation timestamp descending, then ID ascending. */
export function compareNewsReadOrder(a: NewsReadOrderRecord, b: NewsReadOrderRecord): number {
  const timeA = Date.parse(a.createdAt);
  const timeB = Date.parse(b.createdAt);
  if (timeA !== timeB) return timeB - timeA;
  return a.id.localeCompare(b.id);
}

/** Require a strict timestamp with timezone and valid calendar/time components. */
export function isValidNewsReadOrderRecord(value: unknown): value is NewsReadOrderRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<NewsReadOrderRecord>;
  if (typeof record.id !== "string" || !record.id.trim() || record.id.length > 128 || typeof record.createdAt !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(record.createdAt);
  if (!match || !Number.isFinite(Date.parse(record.createdAt))) return false;
  const [, y, mo, d, h, mi, s, zone] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(s);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  const zoneMatch = zone !== "Z" ? /[+-](\d{2}):(\d{2})$/.exec(zone) : null;
  const validZone = !zoneMatch || (Number(zoneMatch[1]) <= 23 && Number(zoneMatch[2]) <= 59);
  return month >= 1 && month <= 12 && day >= 1 && day <= days && hour <= 23 && minute <= 59 && second <= 59 && validZone;
}

/** Return a sorted copy; reject malformed records rather than silently misordering them. */
export function sortNewsReadRecords<T extends NewsReadOrderRecord>(records: readonly T[]): T[] {
  if (!records.every(isValidNewsReadOrderRecord)) {
    throw new TypeError("News read ordering requires valid record IDs and timestamps.");
  }
  return [...records].sort(compareNewsReadOrder);
}
