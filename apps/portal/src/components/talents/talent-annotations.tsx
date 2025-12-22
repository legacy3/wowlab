"use client";

import { memo } from "react";
import {
  KonvaGroup,
  KonvaLine,
  KonvaCircle,
  KonvaRect,
  KonvaText,
} from "@/components/konva";
import type {
  Annotation,
  ArrowAnnotation,
  TextAnnotation,
  CircleAnnotation,
  NumberAnnotation,
} from "@/hooks/use-annotations";

const ArrowShape = memo(function ArrowShape({
  annotation,
  isSelected,
  onSelect,
}: {
  annotation: ArrowAnnotation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [x1, y1, x2, y2] = annotation.points;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 12;

  return (
    <KonvaGroup onClick={onSelect}>
      <KonvaLine
        points={[x1, y1, x2, y2]}
        stroke={annotation.color}
        strokeWidth={3}
        lineCap="round"
        hitStrokeWidth={15}
      />
      <KonvaLine
        points={[
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6),
          x2,
          y2,
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6),
        ]}
        stroke={annotation.color}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
      {isSelected && (
        <>
          <KonvaCircle x={x1} y={y1} radius={6} fill={annotation.color} />
          <KonvaCircle x={x2} y={y2} radius={6} fill={annotation.color} />
        </>
      )}
    </KonvaGroup>
  );
});

const TextShape = memo(function TextShape({
  annotation,
  isSelected,
  onSelect,
}: {
  annotation: TextAnnotation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const padding = 6;

  return (
    <KonvaGroup x={annotation.x} y={annotation.y} onClick={onSelect}>
      <KonvaRect
        x={-padding}
        y={-padding}
        width={annotation.content.length * 8 + padding * 2}
        height={20 + padding * 2}
        fill="rgba(0,0,0,0.75)"
        cornerRadius={4}
        stroke={isSelected ? annotation.color : "transparent"}
        strokeWidth={2}
      />
      <KonvaText
        text={annotation.content}
        fontSize={16}
        fontStyle="bold"
        fill={annotation.color}
      />
    </KonvaGroup>
  );
});

const CircleShape = memo(function CircleShape({
  annotation,
  isSelected,
  onSelect,
}: {
  annotation: CircleAnnotation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <KonvaCircle
      x={annotation.x}
      y={annotation.y}
      radius={annotation.radius}
      stroke={annotation.color}
      strokeWidth={isSelected ? 4 : 3}
      dash={[8, 4]}
      hitStrokeWidth={15}
      onClick={onSelect}
    />
  );
});

const NumberShape = memo(function NumberShape({
  annotation,
  isSelected,
  onSelect,
}: {
  annotation: NumberAnnotation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const size = 28;

  return (
    <KonvaGroup x={annotation.x} y={annotation.y} onClick={onSelect}>
      <KonvaCircle
        radius={size / 2}
        fill={annotation.color}
        stroke={isSelected ? "#fff" : "rgba(0,0,0,0.5)"}
        strokeWidth={isSelected ? 3 : 2}
      />
      <KonvaText
        x={-size / 2}
        y={-8}
        width={size}
        text={String(annotation.value)}
        fontSize={16}
        fontStyle="bold"
        fill="#000"
        align="center"
      />
    </KonvaGroup>
  );
});

interface TalentAnnotationsProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const TalentAnnotations = memo(function TalentAnnotations({
  annotations,
  selectedId,
  onSelect,
}: TalentAnnotationsProps) {
  return (
    <>
      {annotations.map((annotation) => {
        const isSelected = annotation.id === selectedId;
        const handleSelect = () => onSelect(annotation.id);

        switch (annotation.type) {
          case "arrow":
            return (
              <ArrowShape
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            );
          case "text":
            return (
              <TextShape
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            );
          case "circle":
            return (
              <CircleShape
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            );
          case "number":
            return (
              <NumberShape
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect}
              />
            );
        }
      })}
    </>
  );
});
