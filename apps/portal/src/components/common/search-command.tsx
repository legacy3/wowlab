"use client";

import { FileTextIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { VStack } from "styled-system/jsx";

import { useLocalizedRouter } from "@/lib/routing";
import { searchDocs } from "@/lib/search";

import { Command, Text } from "../ui";

export type SearchCommandProps = {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export function SearchCommand({ onOpenChange, open }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const router = useLocalizedRouter();

  // Compute results during render instead of useEffect
  const results = useMemo(() => searchDocs(query), [query]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuery("");
    }
    onOpenChange?.(newOpen);
  };

  const handleSelect = (slug: string) => {
    onOpenChange?.(false);
    router.push(`/dev/docs/${slug}`);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(e) => handleOpenChange(e.open)}
      title="Search Documentation"
      description="Search for documentation pages"
    >
      <Command.Input
        placeholder="Search docs..."
        value={query}
        onValueChange={setQuery}
      />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        {results.length > 0 && (
          <Command.Group heading="Documentation">
            {results.map((result) => (
              <Command.Item
                key={result.slug}
                value={result.slug}
                onSelect={() => handleSelect(result.slug)}
              >
                <FileTextIcon size={16} />
                <VStack gap="0" alignItems="flex-start">
                  <Text fontWeight="medium">{result.title}</Text>
                  {result.description && (
                    <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                      {result.description}
                    </Text>
                  )}
                </VStack>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
