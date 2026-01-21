"use client";

import { useDebounceFn } from "ahooks";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Flex, Stack } from "styled-system/jsx";

import { Badge, Button, Input } from "@/components/ui";

import { DataCard, JsonOutput, Section, Subsection } from "../../shared";

interface EntityDisplayProps<T extends Record<string, unknown>> {
  description: string;
  id: string;
  inputId: number;
  nameField: keyof T;
  onIdChange: (id: number) => void;
  result: StateResult<T>;
  title: string;
}

type StateResult<T> = {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  refresh?: () => void;
};

export function EntityDisplay<T extends Record<string, unknown>>({
  description,
  id,
  inputId,
  nameField,
  onIdChange,
  result,
  title,
}: EntityDisplayProps<T>) {
  const { entityDisplay: content } = useIntlayer("dev");
  const name = result.data?.[nameField];
  const [inputValue, setInputValue] = useState(String(inputId));

  const { run: debouncedOnChange } = useDebounceFn(
    (value: string) => {
      const parsed = parseInt(value) || 0;
      if (parsed !== inputId) {
        onIdChange(parsed);
      }
    },
    { wait: 300 },
  );

  const handleChange = (value: string) => {
    setInputValue(value);
    debouncedOnChange(value);
  };

  return (
    <Section id={id} title={title}>
      <Subsection title="Fetches transformed data by ID">
        <DataCard title={`${title}(id)`} description={description}>
          <Stack gap="4">
            <Flex gap="2" alignItems="center">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={content.enterId}
                w="32"
              />
              {result.refresh && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => result.refresh?.()}
                >
                  {content.refresh}
                </Button>
              )}
            </Flex>

            <Flex gap="2" flexWrap="wrap">
              <Badge variant="outline">ID: {inputId}</Badge>
              {name && <Badge colorPalette="green">{String(name)}</Badge>}
              {result.isLoading && (
                <Badge colorPalette="amber">{content.loading}</Badge>
              )}
            </Flex>

            <JsonOutput
              data={result.data}
              error={result.error}
              isLoading={result.isLoading}
            />
          </Stack>
        </DataCard>
      </Subsection>
    </Section>
  );
}
