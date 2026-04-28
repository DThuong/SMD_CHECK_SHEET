export interface FuzzyMatch {
  /** Indices of matched characters in the original string */
  indices: number[];
  /** Score: higher = better match (0 = no match) */
  score: number;
}

/**
 * Core fuzzy match algorithm.
 * Returns matched character indices and a relevance score.
 * Returns null if query characters are not all found in order.
 */
export function fuzzyMatch(text: string, query: string): FuzzyMatch | null {
  if (!query) return { indices: [], score: 0 };

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return { indices: [], score: 0 };

  const indices: number[] = [];
  let textIdx = 0;
  let score = 0;
  let consecutive = 0;
  let prevIdx = -1;

  for (let qi = 0; qi < lowerQuery.length; qi++) {
    const ch = lowerQuery[qi];
    let found = false;

    while (textIdx < lowerText.length) {
      if (lowerText[textIdx] === ch) {
        indices.push(textIdx);

        // Bonus: consecutive characters
        if (prevIdx !== -1 && textIdx === prevIdx + 1) {
          consecutive++;
          score += 5 + consecutive * 2;
        } else {
          consecutive = 0;
          score += 1;
        }

        // Bonus: start of word
        if (textIdx === 0 || /[\s\-_./]/.test(text[textIdx - 1])) {
          score += 8;
        }

        // Bonus: exact case match
        if (text[textIdx] === query[qi]) {
          score += 2;
        }

        prevIdx = textIdx;
        textIdx++;
        found = true;
        break;
      }
      textIdx++;
    }

    if (!found) return null; // query char not found → no match
  }

  // Penalty: longer text = lower base relevance
  score -= Math.floor(lowerText.length / 10);

  // Bonus: query covers a large portion of the text
  score += Math.floor((lowerQuery.length / lowerText.length) * 10);

  return { indices, score: Math.max(score, 1) };
}

// ─── Highlight ─────────────────────────────────────────────────────────────

export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

/**
 * Splits `text` into segments based on matched indices.
 * Use for rendering highlighted search results.
 */
export function getHighlightSegments(
  text: string,
  indices: number[]
): HighlightSegment[] {
  if (!indices.length) return [{ text, highlight: false }];

  const segments: HighlightSegment[] = [];
  const matchSet = new Set(indices);
  let i = 0;

  while (i < text.length) {
    if (matchSet.has(i)) {
      // Find consecutive highlighted range
      let j = i;
      while (j < text.length && matchSet.has(j)) j++;
      segments.push({ text: text.slice(i, j), highlight: true });
      i = j;
    } else {
      let j = i;
      while (j < text.length && !matchSet.has(j)) j++;
      segments.push({ text: text.slice(i, j), highlight: false });
      i = j;
    }
  }

  return segments;
}

// ─── Filter + Sort ──────────────────────────────────────────────────────────

export interface FuzzyResult<T> {
  item: T;
  score: number;
  indices: number[];
}

/**
 * Filters and sorts an array of items by fuzzy match score.
 *
 * @param items   Array of items to search
 * @param query   Search query
 * @param getKey  Function extracting the searchable string from an item
 * @param minScore Minimum score threshold (default: 1)
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getKey: (item: T) => string,
  minScore = 1
): FuzzyResult<T>[] {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 0, indices: [] }));
  }

  const results: FuzzyResult<T>[] = [];

  for (const item of items) {
    const key = getKey(item);
    const match = fuzzyMatch(key, query);
    if (match && match.score >= minScore) {
      results.push({ item, score: match.score, indices: match.indices });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── Suggestions ────────────────────────────────────────────────────────────

/**
 * Returns the top-N unique suggestion strings from an array of strings,
 * ranked by fuzzy score.
 *
 * @param candidates All possible suggestion strings
 * @param query      Current search query
 * @param limit      Max number of suggestions (default: 6)
 */
export function getSuggestions(
  candidates: string[],
  query: string,
  limit = 6
): Array<{ value: string; score: number; indices: number[] }> {
  if (!query || typeof query !== 'string' || !query.trim()) return [];

  const seen = new Set<string>();
  const results: Array<{ value: string; score: number; indices: number[] }> = [];

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);

    const match = fuzzyMatch(candidate, query);
    if (match && match.score >= 1) {
      results.push({ value: candidate, score: match.score, indices: match.indices });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}