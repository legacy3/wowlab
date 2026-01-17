import type { ReactNode } from "react";

import { Box, Flex, VStack } from "styled-system/jsx";

import { Text } from "@/components/ui/text";

type MdStepProps = {
  children: ReactNode;
  title: string;
  step?: number;
};

type MdStepsProps = {
  children: ReactNode;
};

export function MdStep({ children, step, title }: MdStepProps) {
  return (
    <Flex gap="4" pb="6" position="relative">
      <Flex
        flexDirection="column"
        alignItems="center"
        flexShrink={0}
        w="8"
        position="relative"
      >
        <Flex
          w="8"
          h="8"
          borderRadius="full"
          bg="amber.solid.bg"
          color="amber.solid.fg"
          alignItems="center"
          justifyContent="center"
          fontWeight="semibold"
          fontSize="sm"
          zIndex="1"
        >
          {step}
        </Flex>
        <Box
          position="absolute"
          top="8"
          bottom="0"
          w="0.5"
          bg="border.muted"
          _last={{ display: "none" }}
        />
      </Flex>
      <Box flex="1" pt="1">
        <Text fontWeight="semibold" mb="1">
          {title}
        </Text>
        <Box color="fg.muted">{children}</Box>
      </Box>
    </Flex>
  );
}

export function MdSteps({ children }: MdStepsProps) {
  return (
    <VStack gap="0" alignItems="stretch" my="6">
      {children}
    </VStack>
  );
}
