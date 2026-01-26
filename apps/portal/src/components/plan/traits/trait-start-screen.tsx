"use client";

import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Container, Flex, styled, VStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { Button, Input, Text } from "@/components/ui";
import { routes, useLocalizedRouter } from "@/lib/routing";
import { encodeMinimalLoadout } from "@/lib/wasm";

export function TraitStartScreen() {
  const router = useLocalizedRouter();
  const [loadoutInput, setLoadoutInput] = useState("");
  const { startScreen: content } = useIntlayer("traits");

  const handleSpecSelect = async (specId: number) => {
    const loadout = await encodeMinimalLoadout(specId);
    router.push(
      `${routes.plan.traits.path}?loadout=${encodeURIComponent(loadout)}`,
    );
  };

  const handleLoadoutSubmit = () => {
    const trimmed = loadoutInput.trim();
    if (trimmed) {
      router.push(
        `${routes.plan.traits.path}?loadout=${encodeURIComponent(trimmed)}`,
      );
    }
  };

  return (
    <Container maxW="7xl" py="8">
      <VStack gap="8" minH="400px" justify="center">
        {/* Header */}
        <VStack gap="2" textAlign="center">
          <Text fontWeight="bold" textStyle="2xl">
            {content.traitCalculator}
          </Text>
          <Text color="fg.muted" textStyle="sm">
            {content.planYourBuild}
          </Text>
        </VStack>

        {/* Import section */}
        <VStack gap="4" w="full" maxW="md">
          <VStack gap="2" textAlign="center">
            <Text fontWeight="semibold" textStyle="lg">
              {content.importTraitString}
            </Text>
            <Text color="fg.muted" textStyle="sm">
              {content.pasteLoadoutStringDescription}
            </Text>
          </VStack>
          <Flex gap="2" w="full">
            <Input
              flex="1"
              fontFamily="mono"
              placeholder={content.pasteATraitString.value}
              textStyle="sm"
              value={loadoutInput}
              onChange={(e) => setLoadoutInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadoutSubmit()}
            />
            <Button
              onClick={handleLoadoutSubmit}
              disabled={!loadoutInput.trim()}
            >
              {content.load}
            </Button>
          </Flex>
        </VStack>

        {/* Divider */}
        <Flex align="center" gap="4" w="full" maxW="md">
          <styled.div
            flex="1"
            borderTopWidth="1"
            borderColor="border.default"
          />
          <Text color="fg.muted" textStyle="sm">
            {content.or}
          </Text>
          <styled.div
            flex="1"
            borderTopWidth="1"
            borderColor="border.default"
          />
        </Flex>

        {/* Spec picker section */}
        <VStack gap="4">
          <VStack gap="2" textAlign="center">
            <Text fontWeight="semibold" textStyle="lg">
              {content.startFromScratch}
            </Text>
            <Text color="fg.muted" textStyle="sm">
              {content.chooseClassAndSpec}
            </Text>
          </VStack>
          <SpecPicker onSelect={handleSpecSelect} />
        </VStack>
      </VStack>
    </Container>
  );
}
