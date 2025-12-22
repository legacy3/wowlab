"use client";

import { memo, useCallback, useMemo } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaCircle } from "../base";
import type {
  CircleAnnotation as CircleAnnotationType,
  AnnotationComponentProps,
} from "./types";

const STROKE_WIDTH = 3;
const HIT_STROKE_WIDTH = 24;
const ANCHOR_RADIUS = 8;
const MIN_RADIUS = 10;

type Props = AnnotationComponentProps<CircleAnnotationType>;

export const CircleAnnotation = memo(function CircleAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const { x, y, radius, color } = annotation;

  // Calculate anchor positions (N, E, S, W)
  const anchors = useMemo(
    () => [
      { id: "n", x: 0, y: -radius },
      { id: "e", x: radius, y: 0 },
      { id: "s", x: 0, y: radius },
      { id: "w", x: -radius, y: 0 },
    ],
    [radius],
  );

  // Handle center drag
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x: pos.x, y: pos.y });
    },
    [onChange],
  );

  // Handle resize via anchor drag
  const handleAnchorDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const anchorPos = e.target.position();
      // Calculate new radius based on distance from center
      const newRadius = Math.max(
        MIN_RADIUS,
        Math.sqrt(anchorPos.x * anchorPos.x + anchorPos.y * anchorPos.y),
      );
      onChange({ radius: newRadius });
    },
    [onChange],
  );

  return (
    <KonvaGroup x={x} y={y} draggable onDragEnd={handleDragEnd}>
      {/* Main circle */}
      <KonvaCircle
        radius={radius}
        stroke={color}
        strokeWidth={isSelected ? STROKE_WIDTH + 1 : STROKE_WIDTH}
        dash={[8, 4]}
        hitStrokeWidth={HIT_STROKE_WIDTH}
        onClick={onSelect}
        onTap={onSelect}
      />

      {/* Resize anchors */}
      {isSelected &&
        anchors.map((anchor) => (
          <KonvaCircle
            key={anchor.id}
            x={anchor.x}
            y={anchor.y}
            radius={ANCHOR_RADIUS}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
            draggable
            onDragMove={handleAnchorDrag}
          />
        ))}
    </KonvaGroup>
  );
});
