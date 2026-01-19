"use client";

import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { memo } from "react";
import { css } from "styled-system/css";
import { HStack } from "styled-system/jsx";

import { IconButton, Tooltip } from "@/components/ui";

import type { CanvasState } from "../core/types";

// =============================================================================
// Styles
// =============================================================================

const toolbarStyles = css({
  alignItems: "center",
  backdropFilter: "blur(8px)",
  bg: "bg.default/95",
  border: "1px solid",
  borderColor: "border.default",
  borderRadius: "lg",
  boxShadow: "lg",
  display: "flex",
  gap: "2",
  p: "2",
});

const dividerStyles = css({
  bg: "border.default",
  h: "6",
  w: "1px",
});

const zoomTextStyles = css({
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "xs",
  minW: "10",
  textAlign: "center",
});

// =============================================================================
// Types
// =============================================================================

export interface ToolbarProps {
  className?: string;
  onClear: () => void;
  onDelete: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  state: CanvasState;
}

// =============================================================================
// Component
// =============================================================================

export const Toolbar = memo(function Toolbar({
  className,
  onClear,
  onDelete,
  onResetView,
  onZoomIn,
  onZoomOut,
  state,
}: ToolbarProps) {
  return (
    <div className={`${toolbarStyles} ${className ?? ""}`}>
      {/* Zoom */}
      <HStack gap="1">
        <Tooltip content="Zoom Out">
          <IconButton variant="subtle" size="sm" onClick={onZoomOut}>
            <Minus size={16} />
          </IconButton>
        </Tooltip>
        <span className={zoomTextStyles}>{Math.round(state.zoom * 100)}%</span>
        <Tooltip content="Zoom In">
          <IconButton variant="subtle" size="sm" onClick={onZoomIn}>
            <Plus size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Reset View">
          <IconButton variant="subtle" size="sm" onClick={onResetView}>
            <RotateCcw size={16} />
          </IconButton>
        </Tooltip>
      </HStack>

      <div className={dividerStyles} />

      {/* Actions */}
      <HStack gap="1">
        <Tooltip content="Delete Selected (Del)">
          <IconButton variant="subtle" size="sm" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Clear Canvas">
          <IconButton variant="subtle" size="sm" onClick={onClear}>
            <Trash2 size={16} style={{ opacity: 0.5 }} />
          </IconButton>
        </Tooltip>
      </HStack>
    </div>
  );
});
