"use client";

import type { ReactNode } from "react";

import { Box, Flex, Stack } from "styled-system/jsx";

import { Badge, Skeleton, Text } from "@/components/ui";
import { useClasses, useSpecs } from "@/lib/state";

import { DataCard, JsonOutput, Section, Subsection } from "../../shared";

interface ListDisplayProps<T> {
  data: T[];
  description: string;
  id: string;
  isLoading: boolean;
  noun: string;
  renderItems: (items: T[]) => ReactNode;
  title: string;
}

export function ClassesListSection() {
  const { classes, isLoading } = useClasses();

  return (
    <ListDisplay
      id="classes-list"
      title="useClasses"
      noun="classes"
      description="Returns array of { id, label, color } for all playable classes"
      data={classes}
      isLoading={isLoading}
      renderItems={(items) =>
        items.map((cls) => (
          <Badge
            key={cls.id}
            variant="surface"
            style={{ borderColor: cls.color }}
          >
            <Box
              w="2"
              h="2"
              rounded="full"
              style={{ backgroundColor: cls.color }}
            />
            {cls.label}
          </Badge>
        ))
      }
    />
  );
}

export function SpecsListSection() {
  const { isLoading, specs } = useSpecs();

  return (
    <ListDisplay
      id="specs-list"
      title="useSpecs"
      noun="specs"
      description="Returns array of { id, classId, label } for all specializations"
      data={specs}
      isLoading={isLoading}
      renderItems={(items) => (
        <>
          {items.slice(0, 20).map((spec) => (
            <Badge key={spec.id} variant="outline">
              {spec.label}
            </Badge>
          ))}
          {items.length > 20 && (
            <Badge variant="subtle">+{items.length - 20} more</Badge>
          )}
        </>
      )}
    />
  );
}

function ListDisplay<T>({
  data,
  description,
  id,
  isLoading,
  noun,
  renderItems,
  title,
}: ListDisplayProps<T>) {
  return (
    <Section id={id} title={title}>
      <Subsection title={`Fetch all ${noun}`}>
        <DataCard title={`${title}()`} description={description}>
          <Stack gap="4">
            <Flex gap="2" flexWrap="wrap">
              <Badge colorPalette="gray">
                {data.length} {noun}
              </Badge>
              {isLoading && <Badge colorPalette="amber">Loading...</Badge>}
            </Flex>

            {isLoading ? (
              <Stack gap="2">
                <Skeleton h="4" w="80%" />
                <Skeleton h="4" w="60%" />
              </Stack>
            ) : (
              <Flex gap="2" flexWrap="wrap">
                {renderItems(data)}
              </Flex>
            )}

            <Text textStyle="xs" color="fg.muted" fontWeight="medium">
              Raw Data
            </Text>
            <JsonOutput data={data} error={null} isLoading={isLoading} />
          </Stack>
        </DataCard>
      </Subsection>
    </Section>
  );
}
