"use client";

import { useExtracted } from "next-intl";
import { Stack } from "styled-system/jsx";

import type {
  CharacterProfession,
  CharacterSummary,
  EquipmentSlot,
} from "@/lib/sim";

import { Button, Card } from "@/components/ui";

import { CharacterCard } from "./character-card";
import { EquipmentGrid } from "./equipment-grid";

export interface CharacterPanelProps {
  actions?: React.ReactNode;
  character: CharacterSummary;
  children?: React.ReactNode;
  gear: Record<EquipmentSlot, number | null>;
  onClear?: () => void;
  professions?: CharacterProfession[];
}

export function CharacterPanel({
  actions,
  character,
  children,
  gear,
  onClear,
  professions,
}: CharacterPanelProps) {
  const t = useExtracted();

  return (
    <Card.Root>
      <Card.Header p="4">
        <CharacterCard
          character={character}
          professions={professions}
          actions={actions}
        />
      </Card.Header>

      <Card.Body p="4" pt="0">
        <Stack gap="4">
          <EquipmentGrid character={character} gear={gear} />

          {children}

          {onClear && (
            <Button
              variant="plain"
              size="sm"
              onClick={onClear}
              alignSelf="center"
            >
              {t("Import different character")}
            </Button>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
