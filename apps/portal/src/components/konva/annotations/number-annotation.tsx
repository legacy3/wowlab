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
  ANNOTATION_DEFAULT_OPACITY,
  ANNOTATION_DEFAULT_STROKE_WIDTH,
  ANNOTATION_HALO,
  NUMBER_DEFAULT_FONT_SIZE,
  NUMBER_DEFAULT_SIZE,
  ANNOTATION_TEXT_DARK,
  ANNOTATION_TEXT_LIGHT,
} from "./constants";

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
  const {
    x,
    y,
    value,
    color,
    size = NUMBER_DEFAULT_SIZE,
    fontSize = NUMBER_DEFAULT_FONT_SIZE,
    strokeWidth = ANNOTATION_DEFAULT_STROKE_WIDTH,
    opacity = ANNOTATION_DEFAULT_OPACITY,
    fill,
  } = annotation;
  const textColor = getReadableTextColor(fill ?? color);

  // Handle drag
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x: pos.x, y: pos.y }, { saveHistory: true });
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
      opacity={opacity}
    >
      {/* Halo */}
      <KonvaCircle
        radius={size / 2 + 4}
        fill={ANNOTATION_HALO}
        opacity={0.3}
        listening={false}
      />

      {/* Background circle */}
      <KonvaCircle
        radius={size / 2}
        fill={fill ?? color}
        stroke={isSelected ? ANNOTATION_TEXT_LIGHT : ANNOTATION_BADGE_STROKE}
        strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
      />

      {/* Number text */}
      <KonvaText
        x={-size / 2}
        y={-fontSize / 2}
        width={size}
        text={String(value)}
        fontSize={fontSize}
        fontStyle="bold"
        fill={textColor}
        align="center"
        verticalAlign="middle"
      />
    </KonvaGroup>
  );
});
