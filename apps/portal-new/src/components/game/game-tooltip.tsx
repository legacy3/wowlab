"use client";

import type { ReactNode } from "react";

import { Enums } from "@wowlab/core/Schemas";
import { Box, Flex, VStack } from "styled-system/jsx";

import { Text, Tooltip } from "../ui";
import { GameIcon } from "./game-icon";
import { TOOLTIP_COLORS } from "./tooltip-colors";

export type ItemQuality = Enums.ItemQuality;

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
  subtitleColor?: string;
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
  const qualityColor = Enums.ITEM_QUALITY_COLORS[item.quality];

  return (
    <VStack gap="1" alignItems="stretch">
      <TooltipHeader
        iconName={item.iconName}
        title={item.name}
        titleColor={qualityColor}
        subtitle={`Item Level ${item.itemLevel}`}
        subtitleColor={TOOLTIP_COLORS.itemLevel}
      />

      {item.slot && (
        <Text textStyle="xs" style={{ color: TOOLTIP_COLORS.subtle }}>
          {item.slot}
        </Text>
      )}

      {item.effects && item.effects.length > 0 && (
        <VStack gap="0.5" alignItems="stretch">
          {item.effects.map((effect, i) => (
            <Text
              key={i}
              textStyle="xs"
              style={{ color: TOOLTIP_COLORS.effect }}
            >
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
          <Text textStyle="xs" style={{ color: TOOLTIP_COLORS.cost }}>
            {spell.cost}
          </Text>
        )}
        <Text textStyle="xs" style={{ color: TOOLTIP_COLORS.subtle }}>
          {spell.castTime}
        </Text>
        {spell.range && (
          <Text textStyle="xs" style={{ color: TOOLTIP_COLORS.subtle }}>
            {spell.range}
          </Text>
        )}
      </Flex>

      {spell.cooldown && (
        <Text textStyle="xs" style={{ color: TOOLTIP_COLORS.subtle }}>
          {spell.cooldown} cooldown
        </Text>
      )}

      <Text
        textStyle="xs"
        lineHeight="relaxed"
        style={{ color: TOOLTIP_COLORS.description }}
      >
        {spell.description || "No description available"}
      </Text>
    </VStack>
  );
}

function TooltipHeader({
  iconName,
  subtitle,
  subtitleColor = TOOLTIP_COLORS.muted,
  title,
  titleColor = TOOLTIP_COLORS.text,
}: TooltipHeaderProps) {
  return (
    <Flex gap="2" alignItems="start">
      {iconName && (
        <Box
          flexShrink={0}
          overflow="hidden"
          rounded="md"
          borderWidth="1"
          borderColor={TOOLTIP_COLORS.border}
        >
          <GameIcon iconName={iconName} size="lg" />
        </Box>
      )}
      <VStack gap="0" alignItems="start">
        <Text fontWeight="semibold" style={{ color: titleColor }}>
          {title}
        </Text>
        {subtitle && (
          <Text textStyle="xs" style={{ color: subtitleColor }}>
            {subtitle}
          </Text>
        )}
      </VStack>
    </Flex>
  );
}
