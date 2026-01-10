import type { ReactNode } from "react";

import { Container, VStack } from "styled-system/jsx";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function BlogIndexLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxW="3xl" py="12">
      <VStack alignItems="flex-start" gap="6" mb="8">
        <Heading as="h1" size="4xl">
          Blog
        </Heading>
        <Text color="fg.muted" textStyle="lg">
          Updates, announcements, and insights from the WoW Lab team.
        </Text>
      </VStack>
      {children}
    </Container>
  );
}
