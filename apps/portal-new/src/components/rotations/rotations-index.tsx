"use client";

import { Box, VStack } from "styled-system/jsx";

import { Heading, Text } from "@/components/ui";
import { useUser } from "@/lib/state";

import { RotationBrowser } from "./rotation-browser";

export function RotationsIndex() {
  const { data: user } = useUser();

  return (
    <Box p="6" maxW="5xl" mx="auto">
      <VStack gap="6" alignItems="stretch">
        <VStack alignItems="start" gap="1">
          <Heading size="xl">Rotations</Heading>
          <Text color="fg.muted">Browse and create simulation rotations</Text>
        </VStack>

        <RotationBrowser userId={user?.id} />
      </VStack>
    </Box>
  );
}
