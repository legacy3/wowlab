"use client";

import { useIntlayer } from "next-intlayer";
import { Container, VStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { Input, Tabs, Text } from "@/components/ui";
import { useEditor } from "@/lib/state/editor";

import { RotationPresetPicker } from "./rotation-preset-picker";

export function RotationStartScreen() {
  const { startScreen: content } = useIntlayer("editor");
  const name = useEditor((s) => s.name);
  const setName = useEditor((s) => s.setName);
  const setSpecId = useEditor((s) => s.setSpecId);

  const handleSpecSelect = (specId: number) => {
    setSpecId(specId);
  };

  const handlePresetSelect = (preset: { specId: number; name: string }) => {
    setName(preset.name);
    setSpecId(preset.specId);
  };

  return (
    <Container maxW="7xl" py="8">
      <VStack gap="8" minH="400px" justify="center">
        {/* Header */}
        <VStack gap="2" textAlign="center">
          <Text fontWeight="bold" textStyle="2xl">
            {content.rotationEditor}
          </Text>
          <Text color="fg.muted" textStyle="sm">
            {content.buildYourRotation}
          </Text>
        </VStack>

        {/* Name input */}
        <Input
          placeholder={content.rotationName.value}
          value={name}
          onChange={(e) => setName(e.target.value)}
          w="full"
          maxW="md"
          textAlign="center"
        />

        {/* Tabs */}
        <Tabs.Root defaultValue="scratch">
          <Tabs.List mb="6" justifyContent="center">
            <Tabs.Trigger value="scratch">
              {content.startFromScratch}
            </Tabs.Trigger>
            <Tabs.Trigger value="template">
              {content.startFromTemplate}
            </Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="scratch">
            <VStack gap="4">
              <Text color="fg.muted" textStyle="sm">
                {content.chooseClassAndSpec}
              </Text>
              <SpecPicker onSelect={handleSpecSelect} />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="template">
            <VStack gap="4">
              <Text color="fg.muted" textStyle="sm">
                {content.chooseTemplateDescription}
              </Text>
              <RotationPresetPicker onSelect={handlePresetSelect} />
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Container>
  );
}
