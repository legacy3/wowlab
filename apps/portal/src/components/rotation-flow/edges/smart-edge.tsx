"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

interface SmartEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  markerEnd?: string;
  label?: React.ReactNode;
  labelStyle?: React.CSSProperties;
  labelBgStyle?: { fill?: string };
  data?: {
    conditionLabel?: string;
    animated?: boolean;
  };
  selected?: boolean;
}

export const SmartEdge = memo(function SmartEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  data,
  selected,
}: SmartEdgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Use bezier for smoother curves
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const edgeColor = (style?.stroke as string) || "#666";
  const isConditionEdge = data?.conditionLabel === "yes" || data?.conditionLabel === "no";

  return (
    <>
      {/* Invisible wider path for easier hover/selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: isHovered || selected ? 2.5 : (style?.strokeWidth as number) || 1.5,
          stroke: isHovered || selected ? edgeColor : style?.stroke,
          opacity: isHovered || selected ? 1 : 0.8,
          filter: isHovered ? `drop-shadow(0 0 3px ${edgeColor})` : undefined,
          transition: "stroke-width 0.15s, opacity 0.15s, filter 0.15s",
        }}
        markerEnd={markerEnd}
      />

      {/* Animated flow indicator for active edges */}
      {data?.animated && (
        <circle r={2} fill={edgeColor}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Label - show on hover or always for condition edges */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute pointer-events-none px-1.5 py-0.5 rounded text-[9px] font-medium",
              "transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150",
              isConditionEdge ? "opacity-100" : isHovered ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: labelX,
              top: labelY,
              ...labelBgStyle,
              backgroundColor: labelBgStyle?.fill || `${edgeColor}20`,
              color: edgeColor,
              ...labelStyle,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
