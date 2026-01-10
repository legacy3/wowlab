import { Center, VStack } from "styled-system/jsx";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function NotFound() {
  return (
    <Center minH="400px">
      <VStack gap="4" textAlign="center">
        <Heading as="h2" size="xl">
          Not Found
        </Heading>
        <Text color="fg.muted">Could not find requested resource</Text>
      </VStack>
    </Center>
  );
}
