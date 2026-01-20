"use client";

import type { ReactNode } from "react";

import { Box, Flex, VStack } from "styled-system/jsx";

import { useGlobalColors } from "@/lib/state";

import { Text, Tooltip } from "../ui";
import { GameIcon } from "./game-icon";
import { SpellDescription } from "./spell-description";
import { tooltipColors } from "./tooltip-colors";

const QUALITY_COLOR_NAMES = [
  "ITEM_POOR_COLOR",
  "ITEM_STANDARD_COLOR",
  "ITEM_GOOD_COLOR",
  "ITEM_SUPERIOR_COLOR",
  "ITEM_EPIC_COLOR",
  "ITEM_LEGENDARY_COLOR",
  "ITEM_ARTIFACT_COLOR",
  "ITEM_SCALING_STAT_COLOR",
] as const;

export type ItemQuality = number;

export interface ItemTooltipData {
  effects?: Array<{ text: string; isUse?: boolean }>;
  iconName?: string | null;
  itemLevel: number;
  name: string;
  quality: ItemQuality;
  slot?: string;
}

export interface SpellTooltipData {
  castTime: string;
  cooldown?: string;
  cost?: string;
  description: string;
  iconName?: string | null;
  id?: number;
  name: string;
  range?: string;
  rank?: string;
}

type ColorToken = { _dark: string; _light: string };

interface ItemTooltipProps {
  children: ReactNode;
  item: ItemTooltipData;
}

interface SpellTooltipProps {
  children: ReactNode;
  spell: SpellTooltipData;
}

interface TooltipHeaderProps {
  iconName?: string | null;
  subtitle?: string;
  subtitleColor?: ColorToken;
  title: string;
  titleColor?: string;
}

export function ItemTooltip({ children, item }: ItemTooltipProps) {
  return (
    <Tooltip
      content={<ItemTooltipContent item={item} />}
      openDelay={200}
      closeDelay={0}
    >
      {children}
    </Tooltip>
  );
}

export function SpellTooltip({ children, spell }: SpellTooltipProps) {
  return (
    <Tooltip
      content={<SpellTooltipContent spell={spell} />}
      openDelay={200}
      closeDelay={0}
    >
      {children}
    </Tooltip>
  );
}

function ItemTooltipContent({ item }: { item: ItemTooltipData }) {
  const qualityColors = useGlobalColors(...QUALITY_COLOR_NAMES);
  const qualityColor = qualityColors[item.quality]?.color;

  return (
    <VStack gap="1" alignItems="stretch">
      <TooltipHeader
        iconName={item.iconName}
        title={item.name}
        titleColor={qualityColor}
        subtitleColor={tooltipColors.itemLevel}
        subtitle={`Item Level ${item.itemLevel}`}
      />

      {item.slot && (
        <Text textStyle="xs" color={tooltipColors.subtle}>
          {item.slot}
        </Text>
      )}

      {item.effects && item.effects.length > 0 && (
        <VStack gap="0.5" alignItems="stretch">
          {item.effects.map((effect, i) => (
            <Text key={i} textStyle="xs" color={tooltipColors.effect}>
              {effect.isUse && "Use: "}
              {effect.text}
            </Text>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

function SpellTooltipContent({ spell }: { spell: SpellTooltipData }) {
  return (
    <VStack gap="1.5" alignItems="stretch">
      <TooltipHeader
        iconName={spell.iconName}
        title={spell.name}
        subtitle={spell.rank}
      />

      <Flex flexWrap="wrap" gap="3" alignItems="center">
        {spell.cost && (
          <Text textStyle="xs" color={tooltipColors.cost}>
            {spell.cost}
          </Text>
        )}
        <Text textStyle="xs" color={tooltipColors.subtle}>
          {spell.castTime}
        </Text>
        {spell.range && (
          <Text textStyle="xs" color={tooltipColors.subtle}>
            {spell.range}
          </Text>
        )}
      </Flex>

      {spell.cooldown && (
        <Text textStyle="xs" color={tooltipColors.subtle}>
          {spell.cooldown} cooldown
        </Text>
      )}

      <Text
        textStyle="xs"
        lineHeight="relaxed"
        color={tooltipColors.description}
      >
        <SpellDescription
          spellId={spell.id}
          description={spell.description}
          fallback="No description available"
        />
      </Text>
    </VStack>
  );
}

function TooltipHeader({
  iconName,
  subtitle,
  subtitleColor = tooltipColors.muted,
  title,
  titleColor,
}: TooltipHeaderProps) {
  return (
    <Flex gap="2" alignItems="start">
      {iconName && (
        <Box
          flexShrink={0}
          overflow="hidden"
          rounded="md"
          borderWidth="1"
          borderColor={tooltipColors.border}
        >
          <GameIcon iconName={iconName} size="lg" />
        </Box>
      )}
      <VStack gap="0" alignItems="start">
        <Text
          fontWeight="semibold"
          color={titleColor ? undefined : tooltipColors.text}
          style={titleColor ? { color: titleColor } : undefined}
        >
          {title}
        </Text>
        {subtitle && (
          <Text textStyle="xs" color={subtitleColor}>
            {subtitle}
          </Text>
        )}
      </VStack>
    </Flex>
  );
}
