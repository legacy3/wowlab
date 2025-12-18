import { useMemo } from "react";
import Fuse, { type IFuseOptions, type FuseResult } from "fuse.js";

interface UseFuzzySearchOptions<T> {
  items: readonly T[];
  query: string;
  keys?: IFuseOptions<T>["keys"];
  threshold?: number;
  returnAllOnEmpty?: boolean;
  limit?: number;
}

interface UseFuzzySearchResult<T> {
  results: T[];
  rawResults: FuseResult<T>[];
  isSearching: boolean;
}

/**
 * A hook for fuzzy searching through a list of items using Fuse.js
 *
 * @example
 * // Simple string array
 * const { results } = useFuzzySearch({
 *   items: ['apple', 'banana', 'cherry'],
 *   query: 'banan',
 * });
 *
 * @example
 * // Object array with keys
 * const { results } = useFuzzySearch({
 *   items: posts,
 *   query: searchTerm,
 *   keys: ['title', 'description', 'author.name'],
 *   threshold: 0.4,
 * });
 */
export function useFuzzySearch<T>({
  items,
  query,
  keys,
  threshold = 0.3,
  returnAllOnEmpty = true,
  limit,
}: UseFuzzySearchOptions<T>): UseFuzzySearchResult<T> {
  const fuse = useMemo(() => {
    const options: IFuseOptions<T> = {
      threshold,
      ignoreLocation: true,
      includeScore: true,
    };

    if (keys) {
      options.keys = keys;
    }

    return new Fuse([...items], options);
  }, [items, keys, threshold]);

  const { results, rawResults, isSearching } = useMemo(() => {
    const trimmed = query.trim();
    const searching = trimmed.length > 0;

    if (!searching) {
      return {
        results: returnAllOnEmpty ? [...items] : [],
        rawResults: [] as FuseResult<T>[],
        isSearching: false,
      };
    }

    let searchResults = fuse.search(trimmed);

    if (limit && limit > 0) {
      searchResults = searchResults.slice(0, limit);
    }

    return {
      results: searchResults.map((r) => r.item),
      rawResults: searchResults,
      isSearching: true,
    };
  }, [fuse, items, query, returnAllOnEmpty, limit]);

  return { results, rawResults, isSearching };
}

/**
 * Creates a Set of matching IDs from a fuzzy search.
 * Useful for highlighting matches in visualizations.
 *
 * @example
 * const matchingIds = useFuzzySearchIds({
 *   items: nodes,
 *   query: searchQuery,
 *   keys: ['name', 'description'],
 *   getId: (node) => node.id,
 * });
 */
export function useFuzzySearchIds<T, ID>({
  items,
  query,
  keys,
  getId,
  threshold = 0.3,
}: {
  items: readonly T[];
  query: string;
  keys?: IFuseOptions<T>["keys"];
  getId: (item: T) => ID;
  threshold?: number;
}): Set<ID> {
  const { results, isSearching } = useFuzzySearch({
    items,
    query,
    keys,
    threshold,
    returnAllOnEmpty: false,
  });

  return useMemo(() => {
    if (!isSearching) {
      return new Set<ID>();
    }
    return new Set(results.map(getId));
  }, [results, isSearching, getId]);
}
