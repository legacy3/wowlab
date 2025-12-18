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

const METRICS = {
  rowHeight: 52,
  rowGap: 6,
  iconSize: 32,
  padding: 12,
  headerHeight: 36,
};

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
      cornerRadius={4}
      listening={false}
      fallback={
        <KonvaRect
          x={x}
          y={y}
          width={size}
          height={size}
          fill={fallbackColor}
          cornerRadius={4}
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
  const { rowHeight, iconSize, padding } = METRICS;

  const isSkipped = decision?.result === "skipped";

  const bgColor = isCast ? "#22c55e15" : "#18181b";
  const borderColor = isCast ? "#22c55e" : "#27272a";

  const statusText = decision
    ? isCast
      ? "CAST"
      : decision.reason.replace("Failed: ", "")
    : "";

  return (
    <KonvaGroup y={y} opacity={isCast ? 1 : isSkipped ? 0.5 : 0.7}>
      {/* Row background */}
      <KonvaRect
        x={0}
        y={0}
        width={width}
        height={rowHeight}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isCast ? 2 : 1}
        cornerRadius={6}
      />

      {/* Priority badge */}
      <KonvaRect
        x={padding}
        y={(rowHeight - 20) / 2}
        width={20}
        height={20}
        fill={entry.spell.color}
        cornerRadius={4}
      />
      <KonvaText
        x={padding}
        y={(rowHeight - 20) / 2}
        width={20}
        height={20}
        text={String(entry.priority)}
        fontSize={11}
        fontStyle="bold"
        fill="#fff"
        align="center"
        verticalAlign="middle"
      />

      {/* Spell icon */}
      <SpellIcon
        iconName={entry.spell.icon}
        x={padding + 28}
        y={(rowHeight - iconSize) / 2}
        size={iconSize}
        fallbackColor={entry.spell.color}
      />

      {/* Spell name + conditions */}
      <KonvaText
        x={padding + 28 + iconSize + 10}
        y={10}
        text={entry.spell.name}
        fontSize={13}
        fontStyle="bold"
        fill="#e4e4e7"
      />
      <KonvaText
        x={padding + 28 + iconSize + 10}
        y={28}
        text={entry.conditions.map((c) => c.description).join(" · ")}
        fontSize={11}
        fill="#71717a"
      />

      {/* Status */}
      {decision && (
        <KonvaText
          x={width - 100 - padding}
          y={0}
          width={100}
          height={rowHeight}
          text={statusText}
          fontSize={11}
          fill={isCast ? "#22c55e" : "#52525b"}
          align="right"
          verticalAlign="middle"
        />
      )}

      {/* Cast indicator */}
      {isCast && (
        <KonvaLine
          points={[
            width - padding - 6,
            rowHeight / 2 - 5,
            width - padding,
            rowHeight / 2,
            width - padding - 6,
            rowHeight / 2 + 5,
          ]}
          stroke="#22c55e"
          strokeWidth={2}
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
  const { rowHeight, rowGap, padding, headerHeight } = METRICS;

  const decisionMap = useMemo(() => {
    const map = new Map<number, DecisionStep>();
    if (currentFrame) {
      for (const decision of currentFrame.decisions) {
        map.set(decision.spellId, decision);
      }
    }
    return map;
  }, [currentFrame]);

  const contentWidth = width - padding * 2;

  return (
    <KonvaGroup>
      {/* Header */}
      <KonvaText
        x={padding}
        y={padding}
        text={
          currentFrame
            ? `GCD @ ${currentFrame.time.toFixed(1)}s`
            : "Priority List"
        }
        fontSize={13}
        fontStyle="bold"
        fill="#a1a1aa"
      />

      {/* Rows */}
      <KonvaGroup y={headerHeight}>
        {priorityList.map((entry, index) => {
          const decision = decisionMap.get(entry.spell.id);
          const isCast = currentFrame?.castSpellId === entry.spell.id;

          return (
            <PriorityRow
              key={entry.spell.id}
              entry={entry}
              y={index * (rowHeight + rowGap)}
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
