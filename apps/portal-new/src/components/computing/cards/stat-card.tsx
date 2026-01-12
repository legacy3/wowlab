"use client";

import type { LucideIcon } from "lucide-react";

import { HStack } from "styled-system/jsx";

import { Card, Text } from "@/components/ui";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string | number | null;
}

export function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
}: StatCardProps) {
  return (
    <Card.Root h="full">
      <Card.Body
        p="4"
        display="flex"
        flexDir="column"
        alignItems="center"
        textAlign="center"
      >
        <HStack gap="2" color="fg.muted">
          <Icon className={iconClassName} style={{ height: 14, width: 14 }} />
          <Text textStyle="xs">{label}</Text>
        </HStack>
        <Text
          textStyle="2xl"
          fontWeight="bold"
          mt="1"
          fontVariantNumeric="tabular-nums"
        >
          {value ?? "\u2014"}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}
