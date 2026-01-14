"use client";

import { useMemo } from "react";

export interface SpellSearchResult {
  id: number;
  name: string;
}

interface UseSpellSearchOptions {
  /** Search query string */
  query: string;
  /** List of allowed spell IDs (required - filters to spec-relevant spells) */
  allowedSpells: ReadonlyArray<{ id: number; name: string }>;
  /** Whether search is enabled */
  enabled?: boolean;
}

/**
 * Hook to search spells from a curated list of allowed spells.
 * Filters the allowed list by name match - no API call needed.
 */
export function useSpellSearch({
  query,
  allowedSpells,
  enabled = true,
}: UseSpellSearchOptions) {
  const trimmedQuery = query.trim().toLowerCase();
  const shouldSearch = enabled && trimmedQuery.length >= 1;

  const data = useMemo(() => {
    if (!shouldSearch) {
      return [];
    }
    return allowedSpells.filter((spell) =>
      spell.name.toLowerCase().includes(trimmedQuery),
    );
  }, [allowedSpells, trimmedQuery, shouldSearch]);

  return {
    data,
    isLoading: false,
    isError: false,
  };
}
