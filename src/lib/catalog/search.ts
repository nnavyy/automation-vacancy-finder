import type { CatalogItem } from "./data";

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[\s\-_.]+/g, " ").trim();
}

/**
 * Score how well `query` matches `text`. Higher is better, 0 = no match.
 *  100 exact, 80 prefix, 60 word-prefix, 30 substring.
 */
function scoreText(query: string, text: string): number {
  const t = norm(text);
  if (t === query) return 100;
  if (t.startsWith(query)) return 80;
  if (t.split(" ").some((w) => w.startsWith(query))) return 60;
  if (query.length >= 2 && t.includes(query)) return 30;
  return 0;
}

/**
 * Search a catalog. Matches on value first, then aliases (slightly lower).
 * Items in `exclude` (already-selected values, case-insensitive) are skipped.
 */
export function searchCatalog(
  catalog: CatalogItem[],
  rawQuery: string,
  options: { limit?: number; exclude?: string[] } = {}
): string[] {
  const { limit = 8, exclude = [] } = options;
  const query = norm(rawQuery);
  if (!query) return [];

  const taken = new Set(exclude.map((e) => e.trim().toLowerCase()));
  const scored: { value: string; score: number; idx: number }[] = [];

  catalog.forEach((item, idx) => {
    if (taken.has(item.value.toLowerCase())) return;
    let best = scoreText(query, item.value);
    for (const a of item.aliases ?? []) {
      best = Math.max(best, scoreText(query, a) - 5);
    }
    if (best > 0) scored.push({ value: item.value, score: best, idx });
  });

  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  return scored.slice(0, limit).map((s) => s.value);
}
