"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Html } from "react-konva-utils";
import { KonvaGroup, KonvaRect, KonvaText, KonvaCircle } from "../base";
import type {
  TextAnnotation as TextAnnotationType,
  AnnotationComponentProps,
} from "./types";
import {
  ANNOTATION_ANCHOR_STROKE,
  ANNOTATION_HANDLE_BG,
  ANNOTATION_HANDLE_RADIUS,
  ANNOTATION_HANDLE_STROKE_WIDTH,
  ANNOTATION_HALO,
  ANNOTATION_DEFAULT_OPACITY,
  TEXT_DEFAULT_FONT_SIZE,
  TEXT_DEFAULT_FONT_WEIGHT,
  TEXT_DEFAULT_PADDING,
  TEXT_MIN_WIDTH,
  TEXT_DEFAULT_RADIUS,
  TEXT_PLACEHOLDER,
} from "./constants";

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
    height,
    fontSize = TEXT_DEFAULT_FONT_SIZE,
    fontWeight = TEXT_DEFAULT_FONT_WEIGHT,
    fontFamily,
    align = "left",
    padding = TEXT_DEFAULT_PADDING,
    backgroundColor,
    borderRadius = TEXT_DEFAULT_RADIUS,
    opacity = ANNOTATION_DEFAULT_OPACITY,
    strokeWidth = 2,
  } = annotation;
  const groupRef = useRef<Konva.Group>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local editing state - only used during active editing
  const [editingContent, setEditingContent] = useState(content);
  const [editingHeight, setEditingHeight] = useState(
    Math.max(fontSize, height ?? fontSize),
  );
  const prevIsEditingRef = useRef(isEditing);

  // Reset content and focus when editing starts (from any source)
  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;
    prevIsEditingRef.current = isEditing;

    if (isEditing && !wasEditing) {
      // Just started editing - reset to current content
      setEditingContent(content);
      setEditingHeight(Math.max(fontSize, height ?? fontSize));
      // Focus after state update
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      });
    }
    // Note: We intentionally only depend on isEditing, not content
    // Content sync happens on transition to editing, not during editing
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate text dimensions
  const textHeight = Math.max(fontSize, height ?? fontSize);
  const textWidth = Math.max(TEXT_MIN_WIDTH, width);
  const backgroundHeight = textHeight + padding * 2;
  const backgroundWidth = textWidth + padding * 2;

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    onStartEdit?.();
  }, [onStartEdit]);

  // Handle drag
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x: pos.x, y: pos.y }, { saveHistory: true });
    },
    [onChange],
  );

  // Handle textarea changes
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditingContent(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      const nextHeight = Math.max(fontSize, el.scrollHeight);
      setEditingHeight(nextHeight);
    },
    [fontSize],
  );

  // Handle textarea blur (save changes)
  const handleBlur = useCallback(() => {
    if (editingContent !== content || editingHeight !== textHeight) {
      onChange({
        content: editingContent,
        height: editingHeight,
      });
    }
    onStopEdit?.();
  }, [
    content,
    editingContent,
    editingHeight,
    onChange,
    onStopEdit,
    textHeight,
  ]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (editingContent !== content || editingHeight !== textHeight) {
          onChange({
            content: editingContent,
            height: editingHeight,
          });
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
  const showPlaceholder = !isEditing && content.trim().length === 0;

  const handleLeftResize = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const pos = e.target.position();
      const rightEdge = textWidth + padding;
      const nextLeft = Math.min(pos.x, rightEdge - TEXT_MIN_WIDTH);
      const nextWidth = rightEdge - nextLeft - padding;
      const nextX = x + nextLeft + padding;

      onChange({ x: nextX, width: nextWidth }, { saveHistory });
      if (saveHistory) {
        e.target.position({ x: -padding, y: 0 });
      }
    },
    [onChange, padding, textWidth, x],
  );

  const handleLeftResizeMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleLeftResize(e, false),
    [handleLeftResize],
  );

  const handleLeftResizeEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleLeftResize(e, true),
    [handleLeftResize],
  );

  const handleRightResize = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const pos = e.target.position();
      const nextWidth = Math.max(TEXT_MIN_WIDTH, pos.x - padding);
      onChange({ width: nextWidth }, { saveHistory });
      if (saveHistory) {
        e.target.position({ x: textWidth + padding, y: 0 });
      }
    },
    [onChange, padding, textWidth],
  );

  const handleRightResizeMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleRightResize(e, false),
    [handleRightResize],
  );

  const handleRightResizeEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleRightResize(e, true),
    [handleRightResize],
  );

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
      opacity={opacity}
    >
      {/* Halo */}
      <KonvaRect
        x={-padding}
        y={-padding}
        width={backgroundWidth}
        height={backgroundHeight}
        fill={ANNOTATION_HALO}
        opacity={0.35}
        cornerRadius={borderRadius + 2}
        listening={false}
      />

      {/* Background */}
      <KonvaRect
        x={-padding}
        y={-padding}
        width={backgroundWidth}
        height={backgroundHeight}
        fill={backgroundColor ?? "transparent"}
        cornerRadius={borderRadius}
        stroke={isSelected ? color : "transparent"}
        strokeWidth={strokeWidth}
      />

      {/* Text display (hidden when editing) */}
      {!isEditing && (
        <KonvaText
          text={showPlaceholder ? TEXT_PLACEHOLDER : content}
          fontSize={fontSize}
          fontStyle={fontWeight >= 600 ? "bold" : "normal"}
          fontFamily={fontFamily}
          fill={showPlaceholder ? "rgba(255,255,255,0.45)" : color}
          width={textWidth}
          height={textHeight}
          lineHeight={1.25}
          wrap="word"
          align={align}
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
              height: `${isEditing ? editingHeight : textHeight}px`,
              padding: "0",
              margin: "0",
              border: "none",
              background: "transparent",
              color: color,
              fontSize: `${fontSize}px`,
              fontWeight: `${fontWeight}`,
              fontFamily: fontFamily ?? "inherit",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              lineHeight: "1.25",
              whiteSpace: "pre-wrap",
              textAlign: align,
            }}
          />
        </Html>
      )}

      {/* Resize handles */}
      {isSelected && !isEditing && (
        <>
          <KonvaCircle
            x={-padding}
            y={0}
            radius={ANNOTATION_HANDLE_RADIUS}
            fill={ANNOTATION_HANDLE_BG}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            shadowColor={ANNOTATION_ANCHOR_STROKE}
            shadowBlur={6}
            shadowOpacity={0.35}
            draggable
            onDragMove={handleLeftResizeMove}
            onDragEnd={handleLeftResizeEnd}
          />
          <KonvaCircle
            x={textWidth + padding}
            y={0}
            radius={ANNOTATION_HANDLE_RADIUS}
            fill={ANNOTATION_HANDLE_BG}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            shadowColor={ANNOTATION_ANCHOR_STROKE}
            shadowBlur={6}
            shadowOpacity={0.35}
            draggable
            onDragMove={handleRightResizeMove}
            onDragEnd={handleRightResizeEnd}
          />
        </>
      )}
    </KonvaGroup>
  );
});
