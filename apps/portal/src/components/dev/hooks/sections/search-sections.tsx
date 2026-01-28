"use client";

import { useState } from "react";

import type { ItemSummary, SpellSummary } from "@/lib/supabase";

import { items, spells, useResourceList } from "@/lib/refine";

import { SearchDisplay } from "./search-display";

type GameDataSearchResult<T> = {
  data: T[];
  isError: boolean;
  isLoading: boolean;
};

export function ItemSearchSection() {
  const [query, setQuery] = useState("Thunderfury");
  const hookResult = useResourceList<ItemSummary>({
    ...items,
    filters: [{ field: "name", operator: "contains", value: query }],
    meta: { ...items.meta, select: "id, name, item_level, quality, file_name" },
    pagination: { currentPage: 1, pageSize: 20 },
    queryOptions: { enabled: query.length > 2 },
  });

  const result: GameDataSearchResult<ItemSummary> = {
    data: hookResult.data ?? [],
    isError: hookResult.isError,
    isLoading: hookResult.isLoading,
  };

  return (
    <SearchDisplay
      description="Returns array of ItemSummary matching the query"
      id="item-search"
      onQueryChange={setQuery}
      query={query}
      result={result}
      title="useResourceList + items search"
    />
  );
}

export function SpellSearchSection() {
  const [query, setQuery] = useState("Fireball");
  const hookResult = useResourceList<SpellSummary>({
    ...spells,
    filters: [{ field: "name", operator: "contains", value: query }],
    meta: { ...spells.meta, select: "id, name, file_name" },
    pagination: { currentPage: 1, pageSize: 20 },
    queryOptions: { enabled: query.length > 2 },
  });

  const result: GameDataSearchResult<SpellSummary> = {
    data: hookResult.data ?? [],
    isError: hookResult.isError,
    isLoading: hookResult.isLoading,
  };

  return (
    <SearchDisplay
      description="Returns array of SpellSummary matching the query"
      id="spell-search"
      onQueryChange={setQuery}
      query={query}
      result={result}
      title="useResourceList + spells search"
    />
  );
}
