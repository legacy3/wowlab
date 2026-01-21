"use client";

import { useDebounceFn } from "ahooks";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Flex, Stack } from "styled-system/jsx";

import { Badge, Input } from "@/components/ui";

import { DataCard, JsonOutput, Section, Subsection } from "../../shared";

type GameDataSearchResult<T> = {
  data: T[];
  isError: boolean;
  isLoading: boolean;
};

interface SearchDisplayProps {
  description: string;
  id: string;
  onQueryChange: (query: string) => void;
  query: string;
  result: GameDataSearchResult<unknown>;
  title: string;
}

export function SearchDisplay({
  description,
  id,
  onQueryChange,
  query,
  result,
  title,
}: SearchDisplayProps) {
  const { searchDisplay: content } = useIntlayer("dev");
  const [inputValue, setInputValue] = useState(query);

  const { run: debouncedOnChange } = useDebounceFn(
    (value: string) => {
      if (value !== query) {
        onQueryChange(value);
      }
    },
    { wait: 300 },
  );

  const handleChange = (value: string) => {
    setInputValue(value);
    debouncedOnChange(value);
  };

  const formatResultCount = (count: number) => {
    return count === 1 ? "1 result" : `${count} results`;
  };

  return (
    <Section id={id} title={title}>
      <Subsection title="Search by name">
        <DataCard title={`${title}({ query })`} description={description}>
          <Stack gap="4">
            <Flex gap="2" alignItems="center">
              <Input
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={content.search}
                w="64"
              />
            </Flex>

            <Flex gap="2" flexWrap="wrap">
              <Badge variant="outline">Query: {query || content.empty}</Badge>
              <Badge colorPalette="gray">
                {formatResultCount(result.data.length)}
              </Badge>
              {result.isLoading && (
                <Badge colorPalette="amber">{content.loading}</Badge>
              )}
            </Flex>

            <JsonOutput
              data={result.data}
              error={result.isError ? new Error("Search failed") : null}
              isLoading={result.isLoading}
            />
          </Stack>
        </DataCard>
      </Subsection>
    </Section>
  );
}
