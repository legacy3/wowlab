"use client";

import { memo, useCallback, useMemo } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaLine, KonvaCircle } from "../base";
import {
  ANNOTATION_ANCHOR_STROKE,
  ANNOTATION_HANDLE_BG,
  ANNOTATION_HANDLE_RADIUS,
  ANNOTATION_HANDLE_STROKE_WIDTH,
  ANNOTATION_HALO,
  ANNOTATION_DEFAULT_STROKE_WIDTH,
  ANNOTATION_DEFAULT_OPACITY,
  ARROW_DEFAULT_HEAD_LENGTH,
  ARROW_DEFAULT_HEAD_WIDTH,
  normalizeDash,
} from "./constants";
import type {
  ArrowAnnotation as ArrowAnnotationType,
  AnnotationComponentProps,
} from "./types";

const HIT_STROKE_WIDTH = 26;

type Props = AnnotationComponentProps<ArrowAnnotationType>;

export const ArrowAnnotation = memo(function ArrowAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const {
    x1,
    y1,
    x2,
    y2,
    cx,
    cy,
    color,
    strokeWidth = ANNOTATION_DEFAULT_STROKE_WIDTH,
    opacity = ANNOTATION_DEFAULT_OPACITY,
    dash,
    headLength = ARROW_DEFAULT_HEAD_LENGTH,
    headWidth = ARROW_DEFAULT_HEAD_WIDTH,
  } = annotation;

  // Calculate if this is a curved arrow
  const isCurved = cx !== undefined && cy !== undefined;

  // Generate points for the line/curve
  const linePoints = useMemo(() => {
    if (!isCurved) {
      return [x1, y1, x2, y2];
    }
    // Generate quadratic bezier curve points
    const points: number[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const x = mt * mt * x1 + 2 * mt * t * cx! + t * t * x2;
      const y = mt * mt * y1 + 2 * mt * t * cy! + t * t * y2;
      points.push(x, y);
    }
    return points;
  }, [x1, y1, x2, y2, cx, cy, isCurved]);

  // Calculate arrow head angle based on end direction
  const arrowHeadAngle = useMemo(() => {
    if (isCurved) {
      return Math.atan2(y2 - cy!, x2 - cx!);
    }
    return Math.atan2(y2 - y1, x2 - x1);
  }, [x1, y1, x2, y2, cx, cy, isCurved]);

  const arrowHeadPoints = useMemo(() => {
    const sin = Math.sin(arrowHeadAngle);
    const cos = Math.cos(arrowHeadAngle);
    const baseX = x2 - headLength * cos;
    const baseY = y2 - headLength * sin;

    return [
      x2,
      y2,
      baseX + headWidth * sin,
      baseY - headWidth * cos,
      baseX - headWidth * sin,
      baseY + headWidth * cos,
    ];
  }, [arrowHeadAngle, headLength, headWidth, x2, y2]);

  // Default control point position (middle of line)
  const defaultCx = (x1 + x2) / 2;
  const defaultCy = (y1 + y2) / 2;

  // Drag handlers for anchors
  const handleStartDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const pos = e.target.position();
      onChange({ x1: pos.x, y1: pos.y }, { saveHistory });
    },
    [onChange],
  );

  const handleStartDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleStartDrag(e, false),
    [handleStartDrag],
  );

  const handleStartDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleStartDrag(e, true),
    [handleStartDrag],
  );

  const handleEndDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const pos = e.target.position();
      onChange({ x2: pos.x, y2: pos.y }, { saveHistory });
    },
    [onChange],
  );

  const handleEndDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleEndDrag(e, false),
    [handleEndDrag],
  );

  const handleEndDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleEndDrag(e, true),
    [handleEndDrag],
  );

  const handleControlDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, saveHistory = false) => {
      const pos = e.target.position();
      onChange({ cx: pos.x, cy: pos.y }, { saveHistory });
    },
    [onChange],
  );

  const handleControlDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleControlDrag(e, false),
    [handleControlDrag],
  );

  const handleControlDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => handleControlDrag(e, true),
    [handleControlDrag],
  );

  const handleGroupDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      if (pos.x === 0 && pos.y === 0) {
        return;
      }

      onChange({
        x1: x1 + pos.x,
        y1: y1 + pos.y,
        x2: x2 + pos.x,
        y2: y2 + pos.y,
        ...(isCurved ? { cx: (cx ?? 0) + pos.x, cy: (cy ?? 0) + pos.y } : {}),
      });

      e.target.position({ x: 0, y: 0 });
    },
    [cx, cy, isCurved, onChange, x1, x2, y1, y2],
  );

  // Double-click on line to add/remove curve
  const handleDoubleClick = useCallback(() => {
    if (isCurved) {
      // Remove curve - set to undefined
      onChange({ cx: undefined, cy: undefined });
    } else {
      // Add curve at midpoint
      onChange({ cx: defaultCx, cy: defaultCy });
    }
  }, [isCurved, defaultCx, defaultCy, onChange]);

  return (
    <KonvaGroup draggable onDragEnd={handleGroupDragEnd} opacity={opacity}>
      {/* Main line/curve */}
      <KonvaLine
        points={linePoints}
        stroke={ANNOTATION_HALO}
        strokeWidth={strokeWidth + 6}
        lineCap="round"
        lineJoin="round"
        listening={false}
        opacity={0.4}
      />
      <KonvaLine
        points={linePoints}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={HIT_STROKE_WIDTH}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        dash={normalizeDash(dash)}
      />

      {/* Arrow head */}
      <KonvaLine
        points={arrowHeadPoints}
        closed
        fill={color}
        stroke={ANNOTATION_HALO}
        strokeWidth={strokeWidth + 4}
        lineJoin="round"
        opacity={0.4}
        listening={false}
      />
      <KonvaLine
        points={arrowHeadPoints}
        closed
        fill={color}
        stroke={color}
        strokeWidth={Math.max(1, strokeWidth - 1)}
        lineCap="round"
        lineJoin="round"
      />

      {/* Selection/edit anchors */}
      {isSelected && (
        <>
          {/* Start anchor */}
          <KonvaCircle
            x={x1}
            y={y1}
            radius={ANNOTATION_HANDLE_RADIUS}
            fill={ANNOTATION_HANDLE_BG}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            shadowColor={ANNOTATION_ANCHOR_STROKE}
            shadowBlur={6}
            shadowOpacity={0.35}
            draggable
            onDragMove={handleStartDragMove}
            onDragEnd={handleStartDragEnd}
          />

          {/* End anchor */}
          <KonvaCircle
            x={x2}
            y={y2}
            radius={ANNOTATION_HANDLE_RADIUS}
            fill={ANNOTATION_HANDLE_BG}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            shadowColor={ANNOTATION_ANCHOR_STROKE}
            shadowBlur={6}
            shadowOpacity={0.35}
            draggable
            onDragMove={handleEndDragMove}
            onDragEnd={handleEndDragEnd}
          />

          {/* Control point anchor (for curves) */}
          <KonvaCircle
            x={isCurved ? cx : defaultCx}
            y={isCurved ? cy : defaultCy}
            radius={ANNOTATION_HANDLE_RADIUS - 1}
            fill={isCurved ? ANNOTATION_HANDLE_BG : "transparent"}
            stroke={color}
            strokeWidth={ANNOTATION_HANDLE_STROKE_WIDTH}
            dash={isCurved ? undefined : [3, 3]}
            opacity={isCurved ? 1 : 0.5}
            draggable
            onDragMove={handleControlDragMove}
            onDragEnd={handleControlDragEnd}
          />

          {/* Guide lines to control point when curved */}
          {isCurved && (
            <>
              <KonvaLine
                points={[x1, y1, cx!, cy!]}
                stroke={color}
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.4}
                listening={false}
              />
              <KonvaLine
                points={[cx!, cy!, x2, y2]}
                stroke={color}
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.4}
                listening={false}
              />
            </>
          )}
        </>
      )}
    </KonvaGroup>
  );
});
