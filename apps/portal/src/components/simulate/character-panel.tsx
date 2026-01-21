"use client";

import { useIntlayer } from "next-intlayer";
import { Stack } from "styled-system/jsx";

import type { Character, Item, Profession } from "@/lib/sim";

import { Button, Card } from "@/components/ui";

import { CharacterCard } from "./character-card";
import { EquipmentGrid } from "./equipment-grid";

export interface CharacterPanelProps {
  character: Character;
  children?: React.ReactNode;
  equipment: Item[];
  onClear?: () => void;
  professions?: Profession[];
}

export function CharacterPanel({
  character,
  children,
  equipment,
  onClear,
  professions,
}: CharacterPanelProps) {
  const { characterPanel: content } = useIntlayer("simulate");

  return (
    <Card.Root>
      <Card.Header px="4" py="3">
        <CharacterCard character={character} professions={professions} />
      </Card.Header>

      <Card.Body p="4" pt="0">
        <Stack gap="4">
          <EquipmentGrid character={character} equipment={equipment} />

          {children}

          {onClear && (
            <Button
              variant="plain"
              size="sm"
              onClick={onClear}
              alignSelf="center"
            >
              {content.importDifferentCharacter}
            </Button>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
