"use client";

import { Flex, styled, VStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { Input, Text } from "@/components/ui";

interface TalentStartScreenProps {
  onSpecSelect: (specId: number) => void;
  onTalentStringChange: (value: string | null) => void;
  talents: string;
}

export function TalentStartScreen({
  onSpecSelect,
  onTalentStringChange,
  talents,
}: TalentStartScreenProps) {
  return (
    <VStack gap="8" minH="400px" justify="center" py="8">
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
        <Input
          fontFamily="mono"
          placeholder="Paste a talent string ..."
          textStyle="sm"
          value={talents}
          w="full"
          onChange={(e) => onTalentStringChange(e.target.value.trim() || null)}
        />
      </VStack>

      {/* Divider */}
      <Flex align="center" gap="4" w="full" maxW="md">
        <styled.div flex="1" borderTopWidth="1" borderColor="border.default" />
        <Text color="fg.muted" textStyle="sm">
          or
        </Text>
        <styled.div flex="1" borderTopWidth="1" borderColor="border.default" />
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
        <SpecPicker onSelect={onSpecSelect} />
      </VStack>
    </VStack>
  );
}
