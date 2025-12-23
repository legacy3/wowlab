"use client";

import { memo, useCallback, useMemo } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaCircle } from "../base";
import type {
  CircleAnnotation as CircleAnnotationType,
  AnnotationComponentProps,
} from "./types";
import {
  ANNOTATION_ANCHOR_STROKE,
  ANNOTATION_HANDLE_BG,
  ANNOTATION_HANDLE_RADIUS,
  ANNOTATION_HANDLE_STROKE_WIDTH,
  ANNOTATION_HALO,
  ANNOTATION_DEFAULT_OPACITY,
  ANNOTATION_DEFAULT_STROKE_WIDTH,
  CIRCLE_MIN_RADIUS,
  normalizeDash,
} from "./constants";

const HIT_STROKE_WIDTH = 26;

type Props = AnnotationComponentProps<CircleAnnotationType>;

export const CircleAnnotation = memo(function CircleAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const {
    x,
    y,
    radius,
    color,
    strokeWidth = ANNOTATION_DEFAULT_STROKE_WIDTH,
    opacity = ANNOTATION_DEFAULT_OPACITY,
    dash,
    fill,
    fillOpacity,
  } = annotation;

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
      onChange({ x: pos.x, y: pos.y }, { saveHistory: true });
    },
    [onChange],
  );

  // Handle resize via anchor drag
  const handleAnchorDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const anchorPos = e.target.position();
      const newRadius = Math.max(
        CIRCLE_MIN_RADIUS,
        Math.sqrt(anchorPos.x * anchorPos.x + anchorPos.y * anchorPos.y),
      );
      onChange({ radius: newRadius }, { saveHistory });
    },
    [onChange],
  );

  const handleAnchorDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleAnchorDrag(e, false),
    [handleAnchorDrag],
  );

  const handleAnchorDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleAnchorDrag(e, true),
    [handleAnchorDrag],
  );

  return (
    <KonvaGroup
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
      opacity={opacity}
    >
      {/* Main circle */}
      <KonvaCircle
        radius={radius}
        stroke={ANNOTATION_HALO}
        strokeWidth={strokeWidth + 6}
        opacity={0.35}
        listening={false}
      />
      <KonvaCircle
        radius={radius}
        fill={fill ?? undefined}
        fillOpacity={fill ? (fillOpacity ?? 0.2) : undefined}
        stroke={color}
        strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
        dash={normalizeDash(dash)}
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
            radius={ANNOTATION_HANDLE_RADIUS}
            fill={ANNOTATION_HANDLE_BG}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            shadowColor={ANNOTATION_ANCHOR_STROKE}
            shadowBlur={6}
            shadowOpacity={0.35}
            draggable
            onDragMove={handleAnchorDragMove}
            onDragEnd={handleAnchorDragEnd}
          />
        ))}
    </KonvaGroup>
  );
});
