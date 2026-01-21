"use client";

import { Flex, HStack, VStack } from "styled-system/jsx";

import { GameIcon } from "@/components/game";
import { Link, Text } from "@/components/ui";
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
  const relativeTime = formatRelativeTime(new Date(updatedAt));

  return (
    <Link href={href(routes.rotations.editor.edit, { id })}>
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
    </Link>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(days) >= 1) return rtf.format(days, "day");
  if (Math.abs(hours) >= 1) return rtf.format(hours, "hour");
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, "minute");
  return rtf.format(seconds, "second");
}
