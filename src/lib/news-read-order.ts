/** Stable ordering primitive for News read adapters (newest first, ID tie-breaker). */
export interface NewsReadOrderRecord {
  createdAt: string;
  id: string;
}

/**
 * Compare records by parsed creation timestamp descending, then ID ascending.
 * Adapters should validate timestamps and IDs before using this comparator.
 */
export function compareNewsReadOrder(a: NewsReadOrderRecord, b: NewsReadOrderRecord): number {
  const timeA = Date.parse(a.createdAt);
  const timeB = Date.parse(b.createdAt);
  if (timeA !== timeB) return timeB - timeA;
  return a.id.localeCompare(b.id);
}

/** Return a sorted copy; never mutates the repository's original collection. */
export function sortNewsReadRecords<T extends NewsReadOrderRecord>(records: readonly T[]): T[] {
  return [...records].sort(compareNewsReadOrder);
}
