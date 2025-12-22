"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Html } from "react-konva-utils";
import { KonvaGroup, KonvaRect, KonvaText } from "../base";
import type {
  TextAnnotation as TextAnnotationType,
  AnnotationComponentProps,
} from "./types";

const DEFAULT_FONT_SIZE = 16;
const PADDING = 6;
const MIN_WIDTH = 50;

type Props = AnnotationComponentProps<TextAnnotationType>;

export const TextAnnotation = memo(function TextAnnotation({
  annotation,
  isSelected,
  isEditing,
  onSelect,
  onChange,
  onStartEdit,
  onStopEdit,
}: Props) {
  const {
    x,
    y,
    width,
    content,
    color,
    fontSize = DEFAULT_FONT_SIZE,
  } = annotation;
  const groupRef = useRef<Konva.Group>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local editing state - only used during active editing
  const [editingContent, setEditingContent] = useState(content);
  const prevIsEditingRef = useRef(isEditing);

  // Reset content and focus when editing starts (from any source)
  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;
    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing) {
      // Just started editing - reset to current content
      setEditingContent(content);
      // Focus after state update
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      });
    }
    // Note: We intentionally only depend on isEditing, not content
    // Content sync happens on transition to editing, not during editing
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate text dimensions
  const textHeight = fontSize + PADDING * 2;
  const textWidth = Math.max(MIN_WIDTH, width);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    onStartEdit?.();
  }, [onStartEdit]);

  // Handle drag
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x: pos.x, y: pos.y });
    },
    [onChange],
  );

  // Handle textarea changes
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditingContent(e.target.value);
    },
    [],
  );

  // Handle textarea blur (save changes)
  const handleBlur = useCallback(() => {
    if (editingContent !== content) {
      onChange({ content: editingContent });
    }
    onStopEdit?.();
  }, [editingContent, content, onChange, onStopEdit]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (editingContent !== content) {
          onChange({ content: editingContent });
        }
        onStopEdit?.();
      } else if (e.key === "Escape") {
        // Revert - just stop editing without saving
        onStopEdit?.();
      }
      // Stop propagation to prevent canvas keyboard handlers
      e.stopPropagation();
    },
    [editingContent, content, onChange, onStopEdit],
  );

  const displayContent = isEditing ? editingContent : content;

  return (
    <KonvaGroup
      ref={groupRef}
      x={x}
      y={y}
      draggable={!isEditing}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
    >
      {/* Background */}
      <KonvaRect
        x={-PADDING}
        y={-PADDING}
        width={textWidth + PADDING * 2}
        height={textHeight}
        fill="rgba(0,0,0,0.75)"
        cornerRadius={4}
        stroke={isSelected ? color : "transparent"}
        strokeWidth={2}
      />

      {/* Text display (hidden when editing) */}
      {!isEditing && (
        <KonvaText
          text={content}
          fontSize={fontSize}
          fontStyle="bold"
          fill={color}
          width={textWidth}
        />
      )}

      {/* Inline text editor */}
      {isEditing && (
        <Html
          groupProps={{ x: 0, y: 0 }}
          divProps={{
            style: {
              position: "absolute",
              pointerEvents: "auto",
            },
          }}
        >
          <textarea
            ref={textareaRef}
            value={displayContent}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: `${textWidth}px`,
              minHeight: `${fontSize + 4}px`,
              padding: "0",
              margin: "0",
              border: "none",
              background: "transparent",
              color: color,
              fontSize: `${fontSize}px`,
              fontWeight: "bold",
              fontFamily: "inherit",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              lineHeight: "1.2",
            }}
          />
        </Html>
      )}
    </KonvaGroup>
  );
});
