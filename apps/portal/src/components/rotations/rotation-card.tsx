"use client";

import { useFormatter } from "next-intl";
import { Flex, HStack, VStack } from "styled-system/jsx";

import { GameIcon } from "@/components/game";
import { Text } from "@/components/ui";
import { Link as IntlLink } from "@/i18n/navigation";
import { href, routes } from "@/lib/routing";

interface RotationCardProps {
  id: string;
  name: string;
  specIcon: string | null;
  specLabel: string | null;
  updatedAt: string;
}

export function RotationCard({
  id,
  name,
  specIcon,
  specLabel,
  updatedAt,
}: RotationCardProps) {
  const format = useFormatter();
  const relativeTime = format.relativeTime(new Date(updatedAt));

  return (
    <IntlLink href={href(routes.rotations.editor.edit, { id })}>
      <Flex
        px="4"
        py="3"
        gap="4"
        align="center"
        borderWidth="1"
        rounded="lg"
        cursor="pointer"
        transition="background 0.1s"
        _hover={{ bg: "bg.subtle" }}
      >
        <GameIcon iconName={specIcon} size="md" />

        <VStack flex="1" minW="0" alignItems="start" gap="0.5">
          <Text fontWeight="medium" truncate w="full">
            {name}
          </Text>
          {specLabel && (
            <Text textStyle="sm" color="fg.muted" truncate w="full">
              {specLabel}
            </Text>
          )}
        </VStack>

        <Text
          textAlign="right"
          textStyle="sm"
          color="fg.muted"
          display={{ base: "none", sm: "block" }}
          flexShrink={0}
        >
          {relativeTime}
        </Text>
      </Flex>
    </IntlLink>
  );
}
