"use client";

import { useExtracted } from "next-intl";
import { Flex, HStack } from "styled-system/jsx";

import type { Character, Profession } from "@/lib/sim";

import { Heading, IconButton, Text, Tooltip } from "@/components/ui";
import { RaiderIoIcon, WowArmoryIcon } from "@/lib/icons";

export interface CharacterCardProps {
  character: Character;
  professions?: Profession[];
}

export function CharacterCard({
  character,
  professions = [],
}: CharacterCardProps) {
  const t = useExtracted();

  const server = character.server ?? "Unknown";
  const region = character.region?.toUpperCase() ?? "Unknown";

  const infoParts = [
    t("{level, plural, other {Level #}}", { level: character.level }),
    character.spec,
    `${character.race} ${character.class}`,
    ...professions.map((p) => `${p.name} ${p.rank}`),
  ].filter(Boolean);

  return (
    <Flex justify="space-between" align="center" gap="4">
      <Flex direction="column" gap="0.5" minW="0">
        <HStack gap="2">
          <Heading as="h3" size="sm" truncate>
            {character.name}
          </Heading>
          <Text textStyle="sm" color="fg.muted" flexShrink={0}>
            {server}-{region}
          </Text>
        </HStack>

        <Text textStyle="xs" color="fg.subtle" truncate>
          {infoParts.join(" · ")}
        </Text>
      </Flex>

      <HStack gap="1" flexShrink={0}>
        <Tooltip content="Raider.io">
          <IconButton variant="plain" size="sm" asChild>
            <a
              href={`https://raider.io/characters/${region.toLowerCase()}/${server}/${character.name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <RaiderIoIcon width={16} height={16} />
            </a>
          </IconButton>
        </Tooltip>

        <Tooltip content="Armory">
          <IconButton variant="plain" size="sm" asChild>
            <a
              href={`https://worldofwarcraft.blizzard.com/character/${region.toLowerCase()}/${server}/${character.name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WowArmoryIcon width={16} height={16} />
            </a>
          </IconButton>
        </Tooltip>
      </HStack>
    </Flex>
  );
}
