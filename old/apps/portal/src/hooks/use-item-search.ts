"use client";

import { useList } from "@refinedev/core";

export interface ItemSearchResult {
  ID: number;
  Display_lang: string | null;
}

interface UseItemSearchOptions {
  query: string;
  enabled?: boolean;
  limit?: number;
}

/**
 * Hook to search items by name from the DBC item_sparse table.
 * Uses ilike (case-insensitive) search on Display_lang.
 */
export function useItemSearch({
  query,
  enabled = true,
  limit = 20,
}: UseItemSearchOptions) {
  const trimmedQuery = query.trim();
  const shouldSearch = enabled && trimmedQuery.length >= 2;

  const { result, query: queryState } = useList<ItemSearchResult>({
    resource: "item_sparse",
    filters: shouldSearch
      ? [{ field: "Display_lang", operator: "contains", value: trimmedQuery }]
      : [],
    pagination: { pageSize: limit },
    sorters: [{ field: "Display_lang", order: "asc" }],
    meta: { schema: "raw_dbc", select: "ID,Display_lang" },
    queryOptions: {
      enabled: shouldSearch,
    },
  });

  return {
    data: result?.data ?? [],
    isLoading: queryState.isLoading,
    isError: queryState.isError,
  };
}
