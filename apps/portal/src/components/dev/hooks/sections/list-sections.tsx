"use client";

import type { ReactNode } from "react";

import { Box, Flex, Stack } from "styled-system/jsx";

import { Badge, Skeleton, Text } from "@/components/ui";
import {
  useClasses,
  useClassesAndSpecs,
  useGlobalColors,
  useGlobalStrings,
  useSpecs,
} from "@/lib/state";

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

export function ClassesDirectListSection() {
  const { data: classes = [], isLoading } = useClasses();

  return (
    <ListDisplay
      id="classes-direct-list"
      title="useClasses"
      noun="classes"
      description="Returns array of Class with full class data including color"
      data={classes}
      isLoading={isLoading}
      renderItems={(items) =>
        items.map((cls) => (
          <Badge
            key={cls.id}
            variant="surface"
            style={{ borderColor: cls.color ?? undefined }}
          >
            <Box
              w="2"
              h="2"
              rounded="full"
              style={{ backgroundColor: cls.color ?? undefined }}
            />
            {cls.name}
          </Badge>
        ))
      }
    />
  );
}

export function ClassesListSection() {
  const { classes, isLoading } = useClassesAndSpecs();

  return (
    <ListDisplay
      id="classes-list"
      title="useClassesAndSpecs"
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
  const { data: specs = [], isLoading } = useSpecs();

  return (
    <ListDisplay
      id="specs-list"
      title="useSpecs"
      noun="specs"
      description="Returns array of SpecSummary for all specializations"
      data={specs}
      isLoading={isLoading}
      renderItems={(items) => (
        <>
          {items.slice(0, 20).map((spec) => (
            <Badge key={spec.id} variant="outline">
              {spec.name}
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

const QUALITY_COLORS = [
  "ITEM_POOR_COLOR",
  "ITEM_STANDARD_COLOR",
  "ITEM_GOOD_COLOR",
  "ITEM_SUPERIOR_COLOR",
  "ITEM_EPIC_COLOR",
  "ITEM_LEGENDARY_COLOR",
] as const;

export function GlobalColorsSection() {
  const [poor, standard, good, superior, epic, legendary] = useGlobalColors(
    ...QUALITY_COLORS,
  );

  const colors = [poor, standard, good, superior, epic, legendary];

  return (
    <Section id="global-colors" title="useGlobalColors">
      <Subsection title="Fetch specific colors by name">
        <DataCard
          title='useGlobalColors("ITEM_POOR_COLOR", "ITEM_STANDARD_COLOR", ...)'
          description="Returns GlobalColor objects in order, destructurable as tuple"
        >
          <Stack gap="4">
            <Flex gap="2" flexWrap="wrap">
              {colors.map(
                (color) =>
                  color && (
                    <Badge
                      key={color.name}
                      variant="surface"
                      style={{ borderColor: color.color ?? undefined }}
                    >
                      <Box
                        w="2"
                        h="2"
                        rounded="full"
                        style={{ backgroundColor: color.color ?? undefined }}
                      />
                      {color.name}
                    </Badge>
                  ),
              )}
            </Flex>
            <Text textStyle="xs" color="fg.muted" fontWeight="medium">
              Raw Data
            </Text>
            <JsonOutput data={colors} error={null} isLoading={false} />
          </Stack>
        </DataCard>
      </Subsection>
    </Section>
  );
}

const STRING_TAGS = ["OKAY", "CANCEL", "YES", "NO"] as const;

export function GlobalStringsSection() {
  const [okay, cancel, yes, no] = useGlobalStrings(...STRING_TAGS);

  const strings = [okay, cancel, yes, no];

  return (
    <Section id="global-strings" title="useGlobalStrings">
      <Subsection title="Fetch specific strings by tag">
        <DataCard
          title='useGlobalStrings("OKAY", "CANCEL", "YES", "NO")'
          description="Returns GlobalString objects in order, destructurable as tuple"
        >
          <Stack gap="4">
            <Flex gap="2" flexWrap="wrap">
              {strings.map(
                (str) =>
                  str && (
                    <Badge key={str.tag} variant="outline">
                      {str.tag}: {str.value ?? "—"}
                    </Badge>
                  ),
              )}
            </Flex>
            <Text textStyle="xs" color="fg.muted" fontWeight="medium">
              Raw Data
            </Text>
            <JsonOutput data={strings} error={null} isLoading={false} />
          </Stack>
        </DataCard>
      </Subsection>
    </Section>
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
