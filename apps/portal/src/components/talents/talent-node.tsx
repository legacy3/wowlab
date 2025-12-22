"use client";

import { memo } from "react";
import type Konva from "konva";
import {
  KonvaGroup,
  KonvaRect,
  KonvaText,
  KonvaCircle,
  KonvaImage,
} from "@/components/konva";
import type { TalentNodePosition } from "@wowlab/services/Talents";
import type { TooltipState } from "./types";
import {
  NODE_SIZE,
  CHOICE_NODE_SIZE,
  NODE_BORDER,
  NODE_CORNER_RADIUS,
  CHOICE_CORNER_RADIUS,
  HERO_CORNER_RADIUS,
  COLOR_SELECTED_RING,
  COLOR_PATH_HIGHLIGHT,
  COLOR_PATH_TARGET,
  COLOR_HERO_BORDER,
  COLOR_CHOICE_BORDER,
  COLOR_DEFAULT_BORDER,
  COLOR_RANK_BG,
  COLOR_RANK_SELECTED,
  COLOR_RANK_DEFAULT,
  COLOR_BLOCKED,
  COLOR_KEYBOARD_FOCUS,
} from "./constants";
import { useLongPress } from "@/hooks/use-long-press";

const SelectionRing = memo(function SelectionRing({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-3}
      y={-3}
      width={size + 6}
      height={size + 6}
      stroke={COLOR_SELECTED_RING}
      strokeWidth={2}
      cornerRadius={cornerRadius + 2}
      listening={false}
    />
  );
});

const SearchHighlight = memo(function SearchHighlight({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-4}
      y={-4}
      width={size + 8}
      height={size + 8}
      stroke="#3b82f6"
      strokeWidth={2}
      cornerRadius={cornerRadius + 3}
      listening={false}
    />
  );
});

const PathHighlight = memo(function PathHighlight({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-5}
      y={-5}
      width={size + 10}
      height={size + 10}
      stroke={COLOR_PATH_HIGHLIGHT}
      strokeWidth={2}
      cornerRadius={cornerRadius + 4}
      shadowColor={COLOR_PATH_HIGHLIGHT}
      shadowBlur={8}
      shadowOpacity={0.35}
      listening={false}
    />
  );
});

const PathTarget = memo(function PathTarget({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-6}
      y={-6}
      width={size + 12}
      height={size + 12}
      stroke={COLOR_PATH_TARGET}
      strokeWidth={2}
      cornerRadius={cornerRadius + 5}
      shadowColor={COLOR_PATH_TARGET}
      shadowBlur={10}
      shadowOpacity={0.4}
      listening={false}
    />
  );
});

const BlockedHighlight = memo(function BlockedHighlight({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-5}
      y={-5}
      width={size + 10}
      height={size + 10}
      stroke={COLOR_BLOCKED}
      strokeWidth={3}
      cornerRadius={cornerRadius + 4}
      shadowColor={COLOR_BLOCKED}
      shadowBlur={12}
      shadowOpacity={0.6}
      listening={false}
    />
  );
});

const FocusHighlight = memo(function FocusHighlight({
  size,
  cornerRadius,
}: {
  size: number;
  cornerRadius: number;
}) {
  return (
    <KonvaRect
      x={-4}
      y={-4}
      width={size + 8}
      height={size + 8}
      stroke={COLOR_KEYBOARD_FOCUS}
      strokeWidth={2}
      cornerRadius={cornerRadius + 3}
      dash={[4, 2]}
      listening={false}
    />
  );
});

interface TalentNodeProps {
  nodePos: TalentNodePosition;
  isSearchMatch: boolean;
  isSearching: boolean;
  isPathHighlight?: boolean;
  isPathTarget?: boolean;
  isBlocked?: boolean;
  isFocused?: boolean;
  onHover: (state: TooltipState | null) => void;
  onNodeHoverChange?: (nodeId: number | null) => void;
  onNodeClick?: (nodeId: number) => void;
  onNodeRightClick?: (nodeId: number) => void;
  onPaintStart?: (nodeId: number) => void;
  onPaintEnter?: (nodeId: number) => void;
}

const NodeIcon = memo(function NodeIcon({
  iconName,
  x,
  y,
  size,
  cornerRadius,
  opacity,
}: {
  iconName: string;
  x: number;
  y: number;
  size: number;
  cornerRadius: number;
  opacity: number;
}) {
  return (
    <KonvaImage
      iconName={iconName}
      x={x}
      y={y}
      width={size}
      height={size}
      cornerRadius={cornerRadius}
      opacity={opacity}
      listening={false}
      fallback={
        <KonvaRect
          x={x}
          y={y}
          width={size}
          height={size}
          fill="#374151"
          cornerRadius={cornerRadius}
          opacity={opacity}
          listening={false}
        />
      }
    />
  );
});

export const TalentNode = memo(function TalentNode({
  nodePos,
  isSearchMatch,
  isSearching,
  isPathHighlight = false,
  isPathTarget = false,
  isBlocked = false,
  isFocused = false,
  onHover,
  onNodeHoverChange,
  onNodeClick,
  onNodeRightClick,
  onPaintStart,
  onPaintEnter,
}: TalentNodeProps) {
  const { x, y, node, selection, isHero } = nodePos;

  const isSelected = selection?.selected ?? false;
  const ranksPurchased = selection?.ranksPurchased ?? 0;
  const choiceIndex = selection?.choiceIndex;
  const isChoiceNode = node.type === 2 && node.entries.length > 1;

  const size = isChoiceNode ? CHOICE_NODE_SIZE : NODE_SIZE;
  const halfSize = size / 2;

  const cornerRadius = isChoiceNode
    ? CHOICE_CORNER_RADIUS
    : isHero
      ? HERO_CORNER_RADIUS
      : NODE_CORNER_RADIUS;

  const borderColor = isChoiceNode
    ? COLOR_CHOICE_BORDER
    : isHero
      ? COLOR_HERO_BORDER
      : COLOR_DEFAULT_BORDER;

  const baseOpacity = isSelected ? 1 : 0.5;
  const searchOpacity = isSearching && !isSearchMatch ? 0.3 : 1;
  const finalOpacity = baseOpacity * searchOpacity;

  const entry1 = node.entries[0];
  const entry2 = node.entries[1];

  const longPress = useLongPress(
    () => {
      onHover({ x, y, node, selection });
    },
    {
      delay: 400,
      onCancel: () => {
        setTimeout(() => onHover(null), 1500);
      },
    },
  );

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) {
      return;
    }
    const pos = stage.getPointerPosition();
    if (!pos) {
      return;
    }
    onHover({ x: pos.x, y: pos.y, node, selection });
    onNodeHoverChange?.(node.id);
    onPaintEnter?.(node.id);
  };

  const handleMouseLeave = () => {
    onHover(null);
    onNodeHoverChange?.(null);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) {
      return;
    }
    if (!isSelected) {
      return;
    }
    onPaintStart?.(node.id);
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    onNodeRightClick?.(node.id);
  };

  const handleTouchStart = () => {
    longPress.onTouchStart();

    if (!isSelected) {
      return;
    }

    onPaintStart?.(node.id);
  };

  const handleTouchEnd = () => {
    longPress.onTouchEnd();
  };

  const handleTouchMove = () => {
    longPress.onTouchMove();
  };

  const handleClick = () => {
    onNodeClick?.(node.id);
  };

  if (isChoiceNode && entry2) {
    const iconSize = size - NODE_BORDER * 2;
    const halfIconWidth = iconSize / 2;

    // When selected with a choice, show only the selected entry as a single icon
    const hasChoice = isSelected && choiceIndex !== undefined;
    const selectedEntry = hasChoice
      ? choiceIndex === 0
        ? entry1
        : entry2
      : null;

    // If a choice is made, render as single icon (like a normal node)
    if (selectedEntry) {
      return (
        <KonvaGroup
          x={x - halfSize}
          y={y - halfSize}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onClick={handleClick}
        >
          <KonvaRect
            width={size}
            height={size}
            fill="#1f2937"
            cornerRadius={cornerRadius}
            stroke={isHero ? COLOR_HERO_BORDER : "#eab308"}
            strokeWidth={NODE_BORDER}
            opacity={finalOpacity}
          />
          <SelectionRing size={size} cornerRadius={cornerRadius} />
          <NodeIcon
            iconName={selectedEntry.iconFileName || "inv_misc_questionmark"}
            x={NODE_BORDER}
            y={NODE_BORDER}
            size={iconSize}
            cornerRadius={Math.max(0, cornerRadius - NODE_BORDER)}
            opacity={finalOpacity}
          />
          {isSearching && isSearchMatch && (
            <SearchHighlight size={size} cornerRadius={cornerRadius} />
          )}
          {isPathTarget ? (
            <PathTarget size={size} cornerRadius={cornerRadius} />
          ) : isPathHighlight ? (
            <PathHighlight size={size} cornerRadius={cornerRadius} />
          ) : null}
          {isBlocked && (
            <BlockedHighlight size={size} cornerRadius={cornerRadius} />
          )}
          {isFocused && (
            <FocusHighlight size={size} cornerRadius={cornerRadius} />
          )}
        </KonvaGroup>
      );
    }

    // No choice made yet - show split view with both icons
    return (
      <KonvaGroup
        x={x - halfSize}
        y={y - halfSize}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
      >
        <KonvaRect
          width={size}
          height={size}
          fill="#1e1b4b"
          cornerRadius={cornerRadius}
          stroke={borderColor}
          strokeWidth={NODE_BORDER}
          opacity={finalOpacity}
        />

        <KonvaGroup
          clipX={NODE_BORDER}
          clipY={NODE_BORDER}
          clipWidth={halfIconWidth}
          clipHeight={iconSize}
        >
          <NodeIcon
            iconName={entry1?.iconFileName || "inv_misc_questionmark"}
            x={NODE_BORDER}
            y={NODE_BORDER}
            size={iconSize}
            cornerRadius={0}
            opacity={finalOpacity}
          />
        </KonvaGroup>

        <KonvaGroup
          clipX={NODE_BORDER + halfIconWidth}
          clipY={NODE_BORDER}
          clipWidth={halfIconWidth}
          clipHeight={iconSize}
        >
          <NodeIcon
            iconName={entry2.iconFileName || "inv_misc_questionmark"}
            x={NODE_BORDER}
            y={NODE_BORDER}
            size={iconSize}
            cornerRadius={0}
            opacity={finalOpacity}
          />
        </KonvaGroup>

        <KonvaRect
          x={size / 2 - 0.5}
          y={NODE_BORDER}
          width={1}
          height={iconSize}
          fill="#4b5563"
          opacity={0.5}
          listening={false}
        />
        {isSearching && isSearchMatch && (
          <SearchHighlight size={size} cornerRadius={cornerRadius} />
        )}
        {isPathTarget ? (
          <PathTarget size={size} cornerRadius={cornerRadius} />
        ) : isPathHighlight ? (
          <PathHighlight size={size} cornerRadius={cornerRadius} />
        ) : null}
        {isBlocked && (
          <BlockedHighlight size={size} cornerRadius={cornerRadius} />
        )}
        {isFocused && (
          <FocusHighlight size={size} cornerRadius={cornerRadius} />
        )}
      </KonvaGroup>
    );
  }

  const iconSize = size - NODE_BORDER * 2;

  return (
    <KonvaGroup
      x={x - halfSize}
      y={y - halfSize}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={handleClick}
    >
      <KonvaRect
        width={size}
        height={size}
        fill="#1f2937"
        cornerRadius={cornerRadius}
        stroke={
          isSelected ? (isHero ? COLOR_HERO_BORDER : "#eab308") : borderColor
        }
        strokeWidth={NODE_BORDER}
        opacity={finalOpacity}
      />
      {isSelected && <SelectionRing size={size} cornerRadius={cornerRadius} />}
      <NodeIcon
        iconName={entry1?.iconFileName || "inv_misc_questionmark"}
        x={NODE_BORDER}
        y={NODE_BORDER}
        size={iconSize}
        cornerRadius={Math.max(0, cornerRadius - NODE_BORDER)}
        opacity={finalOpacity}
      />
      {node.maxRanks > 1 && (
        <KonvaGroup x={size - 10} y={size - 8}>
          <KonvaCircle
            radius={8}
            fill={COLOR_RANK_BG}
            stroke="#27272a"
            strokeWidth={1}
            listening={false}
          />
          <KonvaText
            x={-8}
            y={-6}
            width={16}
            height={12}
            text={isSelected ? String(ranksPurchased) : String(node.maxRanks)}
            fontSize={10}
            fontStyle="bold"
            fill={isSelected ? COLOR_RANK_SELECTED : COLOR_RANK_DEFAULT}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </KonvaGroup>
      )}
      {isSearching && isSearchMatch && (
        <SearchHighlight size={size} cornerRadius={cornerRadius} />
      )}
      {isPathTarget ? (
        <PathTarget size={size} cornerRadius={cornerRadius} />
      ) : isPathHighlight ? (
        <PathHighlight size={size} cornerRadius={cornerRadius} />
      ) : null}
      {isBlocked && (
        <BlockedHighlight size={size} cornerRadius={cornerRadius} />
      )}
      {isFocused && <FocusHighlight size={size} cornerRadius={cornerRadius} />}
    </KonvaGroup>
  );
});
