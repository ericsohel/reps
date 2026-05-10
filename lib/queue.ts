// Pattern-interleaved queue: no two consecutive problems share a pattern (Rohrer 2012).
// Within a pattern, most-overdue first.

interface DueItem {
  id: number;
  pattern: string;
  dueAt: number;
}

export function interleaveByPattern<T extends DueItem>(items: T[]): T[] {
  const byPattern = new Map<string, T[]>();
  for (const it of items) {
    const arr = byPattern.get(it.pattern) ?? [];
    arr.push(it);
    byPattern.set(it.pattern, arr);
  }
  for (const arr of byPattern.values()) {
    arr.sort((a, b) => a.dueAt - b.dueAt); // most overdue first
  }

  const result: T[] = [];
  let lastPattern: string | null = null;
  while (true) {
    const candidates = [...byPattern.entries()].filter(([p, arr]) => arr.length > 0 && p !== lastPattern);
    const pool = candidates.length > 0
      ? candidates
      : [...byPattern.entries()].filter(([, arr]) => arr.length > 0);
    if (pool.length === 0) break;
    pool.sort((a, b) => a[1][0].dueAt - b[1][0].dueAt);
    const [pattern, arr] = pool[0];
    result.push(arr.shift()!);
    lastPattern = pattern;
  }
  return result;
}
