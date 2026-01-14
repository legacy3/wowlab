"use client";

import { useList } from "@refinedev/core";

export interface GameDataSearchConfig {
  field: string;
  resource: string;
  select: string;
}

export interface GameDataSearchResult<T> {
  data: T[];
  isError: boolean;
  isLoading: boolean;
}

export interface SpellSearchResult {
  ID: number;
  Name_lang: string | null;
}

interface UseGameDataSearchOptions<T> {
  config: GameDataSearchConfig;
  enabled?: boolean;
  limit?: number;
  query: string;
}

export function useGameDataSearch<T extends { ID: number }>({
  config,
  enabled = true,
  limit = 20,
  query,
}: UseGameDataSearchOptions<T>): GameDataSearchResult<T> {
  const trimmedQuery = query.trim();
  const shouldSearch = enabled && trimmedQuery.length >= 2;

  const { query: queryState, result } = useList<T>({
    filters: shouldSearch
      ? [{ field: config.field, operator: "contains", value: trimmedQuery }]
      : [],
    meta: { schema: "raw_dbc", select: config.select },
    pagination: { pageSize: limit },
    queryOptions: {
      enabled: shouldSearch,
    },
    resource: config.resource,
    sorters: [{ field: config.field, order: "asc" }],
  });

  return {
    data: result?.data ?? [],
    isError: queryState.isError,
    isLoading: queryState.isLoading,
  };
}

const SPELL_SEARCH_CONFIG: GameDataSearchConfig = {
  field: "Name_lang",
  resource: "spell_name",
  select: "ID,Name_lang",
};

export interface ItemSearchResult {
  Display_lang: string | null;
  ID: number;
}

export function useSpellSearch(
  options: Omit<UseGameDataSearchOptions<SpellSearchResult>, "config">,
) {
  return useGameDataSearch<SpellSearchResult>({
    ...options,
    config: SPELL_SEARCH_CONFIG,
  });
}

const ITEM_SEARCH_CONFIG: GameDataSearchConfig = {
  field: "Display_lang",
  resource: "item_sparse",
  select: "ID,Display_lang",
};

export function useItemSearch(
  options: Omit<UseGameDataSearchOptions<ItemSearchResult>, "config">,
) {
  return useGameDataSearch<ItemSearchResult>({
    ...options,
    config: ITEM_SEARCH_CONFIG,
  });
}
