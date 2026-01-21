"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Flex, styled, VStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { Button, Input, Text } from "@/components/ui";
import { engine } from "@/lib/engine";
import { routes } from "@/lib/routing";

export function TalentStartScreen() {
  const router = useRouter();
  const [loadoutInput, setLoadoutInput] = useState("");

  const handleSpecSelect = async (specId: number) => {
    const loadout = await engine.encodeMinimalLoadout(specId);
    router.push(
      `${routes.plan.talents.path}?loadout=${encodeURIComponent(loadout)}`,
    );
  };

  const handleLoadoutSubmit = () => {
    const trimmed = loadoutInput.trim();
    if (trimmed) {
      router.push(
        `${routes.plan.talents.path}?loadout=${encodeURIComponent(trimmed)}`,
      );
    }
  };

  return (
    <Container maxW="7xl" py="8">
      <VStack gap="8" minH="400px" justify="center">
        {/* Import section */}
        <VStack gap="4" w="full" maxW="md">
          <VStack gap="2" textAlign="center">
            <Text fontWeight="semibold" textStyle="lg">
              Import Talent String
            </Text>
            <Text color="fg.muted" textStyle="sm">
              Paste a talent loadout string to view and edit
            </Text>
          </VStack>
          <Flex gap="2" w="full">
            <Input
              flex="1"
              fontFamily="mono"
              placeholder="Paste a talent string ..."
              textStyle="sm"
              value={loadoutInput}
              onChange={(e) => setLoadoutInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadoutSubmit()}
            />
            <Button
              onClick={handleLoadoutSubmit}
              disabled={!loadoutInput.trim()}
            >
              Load
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
            or
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
              Start from Scratch
            </Text>
            <Text color="fg.muted" textStyle="sm">
              Choose a class and specialization
            </Text>
          </VStack>
          <SpecPicker onSelect={handleSpecSelect} />
        </VStack>
      </VStack>
    </Container>
  );
}
