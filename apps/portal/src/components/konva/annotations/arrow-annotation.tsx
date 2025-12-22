"use client";

import { memo, useCallback, useMemo } from "react";
import type Konva from "konva";
import { KonvaGroup, KonvaLine, KonvaCircle } from "../base";
import { ANNOTATION_ANCHOR_STROKE } from "./constants";
import type {
  ArrowAnnotation as ArrowAnnotationType,
  AnnotationComponentProps,
} from "./types";

const ANCHOR_RADIUS = 8;
const STROKE_WIDTH = 3;
const HIT_STROKE_WIDTH = 24;
const ARROW_HEAD_LENGTH = 12;

type Props = AnnotationComponentProps<ArrowAnnotationType>;

export const ArrowAnnotation = memo(function ArrowAnnotation({
  annotation,
  isSelected,
  onSelect,
  onChange,
}: Props) {
  const { x1, y1, x2, y2, cx, cy, color } = annotation;

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
      // For curves, use direction from control point to end
      return Math.atan2(y2 - cy!, x2 - cx!);
    }
    return Math.atan2(y2 - y1, x2 - x1);
  }, [x1, y1, x2, y2, cx, cy, isCurved]);

  // Arrow head points
  const arrowHeadPoints = useMemo(() => {
    return [
      x2 - ARROW_HEAD_LENGTH * Math.cos(arrowHeadAngle - Math.PI / 6),
      y2 - ARROW_HEAD_LENGTH * Math.sin(arrowHeadAngle - Math.PI / 6),
      x2,
      y2,
      x2 - ARROW_HEAD_LENGTH * Math.cos(arrowHeadAngle + Math.PI / 6),
      y2 - ARROW_HEAD_LENGTH * Math.sin(arrowHeadAngle + Math.PI / 6),
    ];
  }, [x2, y2, arrowHeadAngle]);

  // Default control point position (middle of line)
  const defaultCx = (x1 + x2) / 2;
  const defaultCy = (y1 + y2) / 2;

  // Drag handlers for anchors
  const handleStartDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x1: pos.x, y1: pos.y });
    },
    [onChange],
  );

  const handleEndDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ x2: pos.x, y2: pos.y });
    },
    [onChange],
  );

  const handleControlDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      onChange({ cx: pos.x, cy: pos.y });
    },
    [onChange],
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
    <KonvaGroup draggable onDragEnd={handleGroupDragEnd}>
      {/* Main line/curve */}
      <KonvaLine
        points={linePoints}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={HIT_STROKE_WIDTH}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
      />

      {/* Arrow head */}
      <KonvaLine
        points={arrowHeadPoints}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
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
            radius={ANCHOR_RADIUS}
            fill={color}
            stroke={ANNOTATION_ANCHOR_STROKE}
            strokeWidth={2}
            draggable
            onDragMove={handleStartDrag}
          />

          {/* End anchor */}
          <KonvaCircle
            x={x2}
            y={y2}
            radius={ANCHOR_RADIUS}
            fill={color}
            stroke={ANNOTATION_ANCHOR_STROKE}
            strokeWidth={2}
            draggable
            onDragMove={handleEndDrag}
          />

          {/* Control point anchor (for curves) */}
          <KonvaCircle
            x={isCurved ? cx : defaultCx}
            y={isCurved ? cy : defaultCy}
            radius={ANCHOR_RADIUS - 1}
            fill={isCurved ? color : "transparent"}
            stroke={color}
            strokeWidth={2}
            dash={isCurved ? undefined : [3, 3]}
            opacity={isCurved ? 1 : 0.5}
            draggable
            onDragMove={handleControlDrag}
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
