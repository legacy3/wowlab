"use client";

import { VStack } from "styled-system/jsx";

import { Text } from "../text";

type StatBadgeColor = "gray" | "green" | "blue" | "amber" | "red" | "purple";

const colorMap: Record<StatBadgeColor, string> = {
  amber: "amber.text",
  blue: "blue.text",
  gray: "fg.muted",
  green: "green.text",
  purple: "purple.text",
  red: "red.text",
};

export type StatBadgeProps = {
  /** Label text */
  label: string;
  /** Value to display */
  value: string;
  /** Color variant */
  color?: StatBadgeColor;
};

/**
 * A simple stat display badge with label and value.
 */
export function StatBadge({ color = "gray", label, value }: StatBadgeProps) {
  return (
    <VStack gap="0">
      <Text textStyle="xs" color="fg.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="medium" color={colorMap[color]}>
        {value}
      </Text>
    </VStack>
  );
}
