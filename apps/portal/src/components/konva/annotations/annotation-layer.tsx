"use client";

import { memo, useCallback } from "react";
import { ArrowAnnotation } from "./arrow-annotation";
import { TextAnnotation } from "./text-annotation";
import { CircleAnnotation } from "./circle-annotation";
import { NumberAnnotation } from "./number-annotation";
import type { Annotation } from "./types";

interface AnnotationLayerProps {
  annotations: Annotation[];
  selectedId: string | null;
  editingTextId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (
    id: string,
    updates: Partial<Annotation>,
    options?: { saveHistory?: boolean },
  ) => void;
  onStartEditText?: (id: string) => void;
  onStopEditText?: () => void;
}

export const AnnotationLayerRenderer = memo(function AnnotationLayerRenderer({
  annotations,
  selectedId,
  editingTextId,
  onSelect,
  onChange,
  onStartEditText,
  onStopEditText,
}: AnnotationLayerProps) {
  const handleSelect = useCallback(
    (id: string) => () => onSelect(id),
    [onSelect],
  );

  const handleChange = useCallback(
    (id: string) =>
      (updates: Partial<Annotation>, options?: { saveHistory?: boolean }) =>
        onChange(id, updates, options),
    [onChange],
  );

  const handleStartEdit = useCallback(
    (id: string) => () => onStartEditText?.(id),
    [onStartEditText],
  );

  return (
    <>
      {annotations.map((annotation) => {
        const isSelected = annotation.id === selectedId;
        const isEditing = annotation.id === editingTextId;

        switch (annotation.type) {
          case "arrow":
            return (
              <ArrowAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect(annotation.id)}
                onChange={handleChange(annotation.id)}
              />
            );

          case "text":
            return (
              <TextAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                isEditing={isEditing}
                onSelect={handleSelect(annotation.id)}
                onChange={handleChange(annotation.id)}
                onStartEdit={handleStartEdit(annotation.id)}
                onStopEdit={onStopEditText}
              />
            );

          case "circle":
            return (
              <CircleAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect(annotation.id)}
                onChange={handleChange(annotation.id)}
              />
            );

          case "number":
            return (
              <NumberAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={handleSelect(annotation.id)}
                onChange={handleChange(annotation.id)}
              />
            );
        }
      })}
    </>
  );
});
