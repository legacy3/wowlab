"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Grid, HStack, Stack } from "styled-system/jsx";

import type { Profile } from "@/lib/sim";
import type { SimConfig } from "@/lib/state";

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
  isSubmitting?: boolean;
  onClear?: () => void;
  onSimulate: (config: SimConfig, iterations: number) => void;
  profile: Profile;
}

export function ConfigureStep({
  isSubmitting = false,
  onClear,
  onSimulate,
  profile,
}: ConfigureStepProps) {
  const { configureStep: content } = useIntlayer("simulate");
  const { goBack } = Steps.useSteps();

  // Form state
  const [duration, setDuration] = useState(300);
  const [iterations, setIterations] = useState(10000);
  const [targetCount, setTargetCount] = useState(1);
  const [fightStyle, setFightStyle] = useState(["patchwerk"]);
  const [bloodlust, setBloodlust] = useState(true);
  const [raidBuffs, setRaidBuffs] = useState(false);
  const [consumables, setConsumables] = useState(true);

  const handleSimulate = () => {
    // Build the config from profile and form values
    // Using placeholder stats for now - proper stat calculation from equipment
    // would require item database lookups
    const config: SimConfig = {
      duration,
      player: {
        name: profile.character.name,
        spec: specToSimSpec(
          profile.character.class,
          profile.character.spec ?? undefined,
        ),
        stats: {
          // Placeholder stats - these would be calculated from equipment
          agility: 8000,
          crit_rating: 2000,
          haste_rating: 1500,
          intellect: 1000,
          mastery_rating: 1800,
          stamina: 5000,
          strength: 1000,
          versatility_rating: 1200,
        },
      },
      target: {
        armor: 0,
        level_diff: 3,
        max_health: 10000000,
      },
    };

    onSimulate(config, iterations);
  };

  return (
    <Stack gap="6">
      <CharacterPanel
        character={profile.character}
        professions={profile.character.professions}
        equipment={profile.equipment ?? []}
        onClear={onClear}
      />

      <Card.Root>
        <Card.Header>
          <Card.Title>{content.simulationSettings}</Card.Title>
          <Card.Description>{content.configureDescription}</Card.Description>
        </Card.Header>
        <Card.Body>
          <Grid columns={{ base: 1, md: 2 }} gap="6">
            <NumberInput.Root
              value={String(duration)}
              onValueChange={(e) => setDuration(e.valueAsNumber || 300)}
              min={30}
              max={900}
              step={30}
            >
              <NumberInput.Label>{content.fightLength}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root
              value={String(iterations)}
              onValueChange={(e) => setIterations(e.valueAsNumber || 10000)}
              min={1000}
              max={100000}
              step={1000}
            >
              <NumberInput.Label>{content.iterations}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root
              value={String(targetCount)}
              onValueChange={(e) => setTargetCount(e.valueAsNumber || 1)}
              min={1}
              max={20}
            >
              <NumberInput.Label>{content.targetCount}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <Select.Root
              collection={fightStyleCollection}
              value={fightStyle}
              onValueChange={(e) => setFightStyle(e.value)}
              positioning={{ sameWidth: true }}
            >
              <Select.Label>{content.fightStyle}</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={content.select.value} />
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
              {content.options}
            </Text>
            <HStack gap="6" flexWrap="wrap">
              <Switch.Root
                checked={bloodlust}
                onCheckedChange={(e) => setBloodlust(e.checked)}
              >
                <Switch.Control />
                <Switch.Label>{content.bloodlust}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root
                checked={raidBuffs}
                onCheckedChange={(e) => setRaidBuffs(e.checked)}
              >
                <Switch.Control />
                <Switch.Label>{content.optimalRaidBuffs}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root
                checked={consumables}
                onCheckedChange={(e) => setConsumables(e.checked)}
              >
                <Switch.Control />
                <Switch.Label>{content.foodAndFlask}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <HStack gap="3" justify="space-between">
        <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
          {content.back}
        </Button>
        <Button onClick={handleSimulate} loading={isSubmitting}>
          {content.runSimulation}
        </Button>
      </HStack>
    </Stack>
  );
}

function specToSimSpec(wowClass: string, spec: string | undefined): string {
  if (!spec) return wowClass;
  // Map common spec names to what the engine expects
  const normalized = spec.toLowerCase().replace(/[_\s]/g, "");
  switch (normalized) {
    case "beastmastery":
      return "beast_mastery";
    case "marksmanship":
      return "marksmanship";
    case "survival":
      return "survival";
    default:
      return spec.toLowerCase().replace(/\s/g, "_");
  }
}
