"use client";

import { useState } from "react";

import { useItemSearch, useSpellSearch } from "@/lib/state";

import { SearchDisplay } from "./search-display";

// Search result type matching react-query return
type GameDataSearchResult<T> = {
  data: T[];
  isError: boolean;
  isLoading: boolean;
};

interface SearchSectionConfig<T> {
  defaultQuery: string;
  description: string;
  id: string;
  title: string;
  useHook: (query: string) => {
    data: T[] | undefined;
    isLoading: boolean;
    isError: boolean;
  };
}

function createSearchSection<T>(config: SearchSectionConfig<T>) {
  return function SearchSection() {
    const [query, setQuery] = useState(config.defaultQuery);
    const hookResult = config.useHook(query);

    const result: GameDataSearchResult<T> = {
      data: hookResult.data ?? [],
      isError: hookResult.isError,
      isLoading: hookResult.isLoading,
    };

    return (
      <SearchDisplay
        description={config.description}
        id={config.id}
        onQueryChange={setQuery}
        query={query}
        result={result}
        title={config.title}
      />
    );
  };
}

export const SpellSearchSection = createSearchSection({
  defaultQuery: "Fireball",
  description: "Returns array of SpellSummary matching the query",
  id: "spell-search",
  title: "useSpellSearch",
  useHook: useSpellSearch,
});

export const ItemSearchSection = createSearchSection({
  defaultQuery: "Thunderfury",
  description: "Returns array of ItemSummary matching the query",
  id: "item-search",
  title: "useItemSearch",
  useHook: useItemSearch,
});
