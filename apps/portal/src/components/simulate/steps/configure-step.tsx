"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useExtracted } from "next-intl";
import { Grid, HStack, Stack } from "styled-system/jsx";

import type { Profile } from "@/lib/sim";

import {
  Button,
  Card,
  NumberInput,
  Select,
  Steps,
  Switch,
  Text,
} from "@/components/ui";

import { CharacterPanel } from "../character-panel";

const fightStyleCollection = createListCollection({
  items: [
    { label: "Patchwerk", value: "patchwerk" },
    { label: "Light Movement", value: "light_movement" },
    { label: "Heavy Movement", value: "heavy_movement" },
    { label: "Dungeon Slice", value: "dungeon_slice" },
  ],
});

export interface ConfigureStepProps {
  onSimulate: () => void;
  profile: Profile;
}

export function ConfigureStep({ onSimulate, profile }: ConfigureStepProps) {
  const t = useExtracted();
  const { goBack } = Steps.useSteps();

  return (
    <Stack gap="6">
      <CharacterPanel
        character={profile.character}
        professions={profile.character.professions}
        equipment={profile.equipment ?? []}
      />

      <Card.Root>
        <Card.Header>
          <Card.Title>{t("Simulation Settings")}</Card.Title>
          <Card.Description>
            {t("Configure how the simulation will run")}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <Grid columns={{ base: 1, md: 2 }} gap="6">
            <NumberInput.Root defaultValue="300" min={30} max={900} step={30}>
              <NumberInput.Label>{t("Fight Length (sec)")}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root
              defaultValue="10000"
              min={1000}
              max={100000}
              step={1000}
            >
              <NumberInput.Label>{t("Iterations")}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root defaultValue="1" min={1} max={20}>
              <NumberInput.Label>{t("Target Count")}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <Select.Root
              collection={fightStyleCollection}
              defaultValue={["patchwerk"]}
              positioning={{ sameWidth: true }}
            >
              <Select.Label>{t("Fight Style")}</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={t("Select...")} />
                  <Select.Indicator />
                </Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {fightStyleCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Grid>

          <Stack gap="4" mt="6">
            <Text fontWeight="medium" textStyle="sm">
              {t("Options")}
            </Text>
            <HStack gap="6" flexWrap="wrap">
              <Switch.Root defaultChecked>
                <Switch.Control />
                <Switch.Label>{t("Bloodlust")}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root>
                <Switch.Control />
                <Switch.Label>{t("Optimal Raid Buffs")}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root defaultChecked>
                <Switch.Control />
                <Switch.Label>{t("Food & Flask")}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <HStack gap="3" justify="space-between">
        <Button variant="outline" onClick={goBack}>
          {t("Back")}
        </Button>
        <Button onClick={onSimulate}>{t("Run Simulation")}</Button>
      </HStack>
    </Stack>
  );
}
