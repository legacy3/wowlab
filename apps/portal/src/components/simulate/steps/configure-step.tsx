"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useIntlayer } from "next-intlayer";
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
  onClear?: () => void;
  onSimulate: () => void;
  profile: Profile;
}

export function ConfigureStep({
  onClear,
  onSimulate,
  profile,
}: ConfigureStepProps) {
  const { configureStep: content } = useIntlayer("simulate");
  const { goBack } = Steps.useSteps();

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
            <NumberInput.Root defaultValue="300" min={30} max={900} step={30}>
              <NumberInput.Label>{content.fightLength}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root
              defaultValue="10000"
              min={1000}
              max={100000}
              step={1000}
            >
              <NumberInput.Label>{content.iterations}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <NumberInput.Root defaultValue="1" min={1} max={20}>
              <NumberInput.Label>{content.targetCount}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>

            <Select.Root
              collection={fightStyleCollection}
              defaultValue={["patchwerk"]}
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
              <Switch.Root defaultChecked>
                <Switch.Control />
                <Switch.Label>{content.bloodlust}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root>
                <Switch.Control />
                <Switch.Label>{content.optimalRaidBuffs}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>

              <Switch.Root defaultChecked>
                <Switch.Control />
                <Switch.Label>{content.foodAndFlask}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <HStack gap="3" justify="space-between">
        <Button variant="outline" onClick={goBack}>
          {content.back}
        </Button>
        <Button onClick={onSimulate}>{content.runSimulation}</Button>
      </HStack>
    </Stack>
  );
}
