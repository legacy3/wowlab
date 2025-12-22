"use client";

import { memo, useCallback } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaCircle, KonvaText } from "../base";
import type {
  NumberAnnotation as NumberAnnotationType,
  AnnotationComponentProps,
} from "./types";
import {
  ANNOTATION_BADGE_STROKE,
  ANNOTATION_TEXT_DARK,
  ANNOTATION_TEXT_LIGHT,
} from "./constants";

const BADGE_SIZE = 28;

type Props = AnnotationComponentProps<NumberAnnotationType>;

function getReadableTextColor(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return ANNOTATION_TEXT_DARK;
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.6 ? ANNOTATION_TEXT_DARK : ANNOTATION_TEXT_LIGHT;
}

export const NumberAnnotation = memo(function NumberAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const { x, y, value, color } = annotation;
  const textColor = getReadableTextColor(color);

  // Handle drag
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x: pos.x, y: pos.y });
    },
    [onChange],
  );

  return (
    <KonvaGroup
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Background circle */}
      <KonvaCircle
        radius={BADGE_SIZE / 2}
        fill={color}
        stroke={isSelected ? ANNOTATION_TEXT_LIGHT : ANNOTATION_BADGE_STROKE}
        strokeWidth={isSelected ? 3 : 2}
      />

      {/* Number text */}
      <KonvaText
        x={-BADGE_SIZE / 2}
        y={-8}
        width={BADGE_SIZE}
        text={String(value)}
        fontSize={16}
        fontStyle="bold"
        fill={textColor}
        align="center"
      />
    </KonvaGroup>
  );
});
