"use client";

import { memo, useCallback } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaCircle, KonvaText } from "../base";
import type {
  NumberAnnotation as NumberAnnotationType,
  AnnotationComponentProps,
} from "./types";

const BADGE_SIZE = 28;

type Props = AnnotationComponentProps<NumberAnnotationType>;

export const NumberAnnotation = memo(function NumberAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const { x, y, value, color } = annotation;

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
        stroke={isSelected ? "#fff" : "rgba(0,0,0,0.5)"}
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
        fill="#000"
        align="center"
      />
    </KonvaGroup>
  );
});
