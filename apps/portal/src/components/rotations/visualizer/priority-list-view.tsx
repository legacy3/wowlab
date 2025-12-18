"use client";

import { memo, useMemo } from "react";
import {
  KonvaGroup,
  KonvaRect,
  KonvaText,
  KonvaLine,
  KonvaImage,
} from "@/components/konva";
import type { PriorityEntry, PlaybackFrame, DecisionStep } from "./mock-data";
import {
  ROW_HEIGHT,
  HEADER_HEIGHT,
  PADDING,
  BADGE_SIZE,
  BADGE_CORNER_RADIUS,
  ICON_SIZE,
  ICON_CORNER_RADIUS,
  CHEVRON_SIZE,
  CHEVRON_STROKE_WIDTH,
  NAME_FONT_SIZE,
  CONDITION_FONT_SIZE,
  STATUS_FONT_SIZE,
  BADGE_FONT_SIZE,
  HEADER_FONT_SIZE,
  ROW_CORNER_RADIUS,
  COLOR_BG_DEFAULT,
  COLOR_BG_CAST,
  COLOR_BORDER_DEFAULT,
  COLOR_BORDER_CAST,
  COLOR_TEXT_NAME,
  COLOR_TEXT_NAME_CAST,
  COLOR_TEXT_CONDITION,
  COLOR_TEXT_STATUS,
  COLOR_TEXT_CAST,
  COLOR_HEADER,
  OPACITY_CAST,
  OPACITY_SKIPPED,
  OPACITY_DEFAULT,
  getRowLayout,
  getRowY,
} from "./constants";

interface SpellIconProps {
  iconName: string;
  x: number;
  y: number;
  size: number;
  fallbackColor: string;
}

const SpellIcon = memo(function SpellIcon({
  iconName,
  x,
  y,
  size,
  fallbackColor,
}: SpellIconProps) {
  return (
    <KonvaImage
      iconName={iconName}
      x={x}
      y={y}
      width={size}
      height={size}
      cornerRadius={ICON_CORNER_RADIUS}
      listening={false}
      fallback={
        <KonvaRect
          x={x}
          y={y}
          width={size}
          height={size}
          fill={fallbackColor}
          cornerRadius={ICON_CORNER_RADIUS}
          listening={false}
        />
      }
    />
  );
});

interface PriorityRowProps {
  entry: PriorityEntry;
  y: number;
  width: number;
  decision?: DecisionStep;
  isCast: boolean;
}

const PriorityRow = memo(function PriorityRow({
  entry,
  y,
  width,
  decision,
  isCast,
}: PriorityRowProps) {
  const isSkipped = decision?.result === "skipped";

  const bgColor = isCast ? COLOR_BG_CAST : COLOR_BG_DEFAULT;
  const borderColor = isCast ? COLOR_BORDER_CAST : COLOR_BORDER_DEFAULT;

  const statusText = decision
    ? isCast
      ? "CAST"
      : decision.reason.replace("Failed: ", "")
    : "";

  // Get layout positions from constants
  const layout = getRowLayout(width);

  const opacity = isCast
    ? OPACITY_CAST
    : isSkipped
      ? OPACITY_SKIPPED
      : OPACITY_DEFAULT;

  return (
    <KonvaGroup y={y} opacity={opacity}>
      {/* Row background */}
      <KonvaRect
        x={0}
        y={0}
        width={layout.contentWidth}
        height={ROW_HEIGHT}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isCast ? 2 : 1}
        cornerRadius={ROW_CORNER_RADIUS}
      />

      {/* Priority badge */}
      <KonvaRect
        x={layout.badgeX}
        y={layout.badgeY}
        width={BADGE_SIZE}
        height={BADGE_SIZE}
        fill={entry.spell.color}
        cornerRadius={BADGE_CORNER_RADIUS}
      />
      <KonvaText
        x={layout.badgeX}
        y={layout.badgeY}
        width={BADGE_SIZE}
        height={BADGE_SIZE}
        text={String(entry.priority)}
        fontSize={BADGE_FONT_SIZE}
        fontStyle="bold"
        fill="#fff"
        align="center"
        verticalAlign="middle"
      />

      {/* Spell icon */}
      <SpellIcon
        iconName={entry.spell.icon}
        x={layout.iconX}
        y={layout.iconY}
        size={ICON_SIZE}
        fallbackColor={entry.spell.color}
      />

      {/* Spell name */}
      <KonvaText
        x={layout.textX}
        y={layout.nameY}
        width={layout.textMaxWidth}
        text={entry.spell.name}
        fontSize={NAME_FONT_SIZE}
        fontStyle="bold"
        fill={isCast ? COLOR_TEXT_NAME_CAST : COLOR_TEXT_NAME}
        ellipsis
      />

      {/* Conditions */}
      <KonvaText
        x={layout.textX}
        y={layout.conditionY}
        width={layout.textMaxWidth}
        text={entry.conditions.map((c) => c.description).join(" · ")}
        fontSize={CONDITION_FONT_SIZE}
        fill={COLOR_TEXT_CONDITION}
        ellipsis
      />

      {/* Status text */}
      {decision && (
        <KonvaText
          x={layout.statusX}
          y={0}
          width={layout.statusWidth}
          height={ROW_HEIGHT}
          text={statusText}
          fontSize={STATUS_FONT_SIZE}
          fontStyle={isCast ? "bold" : "normal"}
          fill={isCast ? COLOR_TEXT_CAST : COLOR_TEXT_STATUS}
          align="right"
          verticalAlign="middle"
        />
      )}

      {/* Cast indicator arrow (chevron) */}
      {isCast && (
        <KonvaLine
          points={[
            layout.chevronX,
            layout.chevronY - CHEVRON_SIZE / 2,
            layout.chevronX + CHEVRON_SIZE / 2,
            layout.chevronY,
            layout.chevronX,
            layout.chevronY + CHEVRON_SIZE / 2,
          ]}
          stroke={COLOR_BORDER_CAST}
          strokeWidth={CHEVRON_STROKE_WIDTH}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </KonvaGroup>
  );
});

interface PriorityListViewProps {
  priorityList: PriorityEntry[];
  currentFrame: PlaybackFrame | null;
  width: number;
  height: number;
}

export const PriorityListView = memo(function PriorityListView({
  priorityList,
  currentFrame,
  width,
  height: _height,
}: PriorityListViewProps) {
  const decisionMap = useMemo(() => {
    const map = new Map<number, DecisionStep>();
    if (currentFrame) {
      for (const decision of currentFrame.decisions) {
        map.set(decision.spellId, decision);
      }
    }
    return map;
  }, [currentFrame]);

  const contentWidth = width - PADDING * 2;

  return (
    <KonvaGroup x={PADDING}>
      {/* Header */}
      <KonvaText
        x={0}
        y={PADDING}
        text={
          currentFrame
            ? `GCD @ ${currentFrame.time.toFixed(1)}s`
            : "Priority List"
        }
        fontSize={HEADER_FONT_SIZE}
        fontStyle="bold"
        fill={COLOR_HEADER}
      />

      {/* Rows */}
      <KonvaGroup y={HEADER_HEIGHT}>
        {priorityList.map((entry, index) => {
          const decision = decisionMap.get(entry.spell.id);
          const isCast = currentFrame?.castSpellId === entry.spell.id;

          return (
            <PriorityRow
              key={entry.spell.id}
              entry={entry}
              y={getRowY(index)}
              width={contentWidth}
              decision={decision}
              isCast={isCast}
            />
          );
        })}
      </KonvaGroup>
    </KonvaGroup>
  );
});
