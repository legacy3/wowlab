"use client";

import { useState } from "react";

import type { GameDataSearchResult } from "@/lib/state";

import { useItemSearch, useSpellSearch } from "@/lib/state";

import { SearchDisplay } from "./search-display";

interface SearchSectionConfig<T> {
  defaultQuery: string;
  description: string;
  id: string;
  title: string;
  useHook: (opts: { query: string }) => GameDataSearchResult<T>;
}

function createSearchSection<T>(config: SearchSectionConfig<T>) {
  return function SearchSection() {
    const [query, setQuery] = useState(config.defaultQuery);
    const result = config.useHook({ query });

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
  description: "Returns array of { ID, Name_lang } matching the query",
  id: "spell-search",
  title: "useSpellSearch",
  useHook: useSpellSearch,
});

export const ItemSearchSection = createSearchSection({
  defaultQuery: "Thunderfury",
  description: "Returns array of { ID, Display_lang } matching the query",
  id: "item-search",
  title: "useItemSearch",
  useHook: useItemSearch,
});
