"use client";

import { useExtracted } from "next-intl";
import { Flex, HStack, Stack, styled } from "styled-system/jsx";

import type { Character, Profession } from "@/lib/sim";

import { Badge, Heading, Text } from "@/components/ui";

export interface CharacterCardProps {
  actions?: React.ReactNode;
  character: Character;
  professions?: Profession[];
}

export function CharacterCard({
  actions,
  character,
  professions = [],
}: CharacterCardProps) {
  const t = useExtracted();

  return (
    <styled.div
      bg="colorPalette.2"
      borderColor="colorPalette.6"
      borderRadius="l3"
      borderWidth="1px"
      p="4"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        gap="4"
        justify="space-between"
      >
        <Stack gap="3">
          <Stack gap="1">
            <Heading as="h3" size="md">
              {character.name}
            </Heading>
            <Text textStyle="sm" color="fg.muted">
              {character.server ?? "Unknown"} &bull;{" "}
              {character.region?.toUpperCase() ?? "Unknown"}
            </Text>
          </Stack>

          <HStack gap="1.5" flexWrap="wrap">
            <Badge size="sm">
              {t("{level, plural, other {Level #}}", {
                level: character.level,
              })}
            </Badge>
            {character.spec && (
              <Badge size="sm" variant="outline">
                {character.spec}
              </Badge>
            )}
            <Badge size="sm" variant="subtle">
              {character.race} {character.class}
            </Badge>
          </HStack>

          {professions.length > 0 && (
            <HStack gap="1.5" flexWrap="wrap">
              {professions.map((prof) => (
                <Badge key={prof.name} size="sm" variant="outline">
                  {prof.name} {prof.rank}
                </Badge>
              ))}
            </HStack>
          )}
        </Stack>

        {actions && (
          <Flex alignItems="flex-start" flexShrink={0}>
            {actions}
          </Flex>
        )}
      </Flex>
    </styled.div>
  );
}
