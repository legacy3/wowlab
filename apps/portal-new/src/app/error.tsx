"use client";

import { Box, Center, VStack } from "styled-system/jsx";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function Error({
  error,
  reset,
}: {
  error: { digest?: string } & Error;
  reset: () => void;
}) {
  return (
    <Center minH="400px">
      <VStack gap="4" textAlign="center">
        <Heading as="h2" size="xl">
          Something went wrong!
        </Heading>
        <Text color="fg.muted">{error.message}</Text>
        <Box>
          <Button onClick={reset}>Try again</Button>
        </Box>
      </VStack>
    </Center>
  );
}
