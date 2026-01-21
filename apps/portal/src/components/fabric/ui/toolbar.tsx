"use client";

import {
  Hand,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { memo } from "react";
import { css, cx } from "styled-system/css";
import { HStack } from "styled-system/jsx";

import { IconButton, Tooltip } from "@/components/ui";

import type { CanvasState } from "../core/types";
import type { InteractionMode } from "../plugins/interaction";

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
  gap: "1",
  p: "1.5",
});

const dividerStyles = css({
  bg: "border.default",
  h: "6",
  mx: "1",
  w: "1px",
});

const zoomTextStyles = css({
  color: "fg.muted",
  fontFamily: "mono",
  fontSize: "xs",
  minW: "12",
  textAlign: "center",
});

const activeToolStyles = css({
  bg: "bg.muted",
  color: "fg.default",
});

// =============================================================================
// Types
// =============================================================================

export interface ToolbarProps {
  className?: string;
  /** Current interaction mode */
  mode?: InteractionMode;
  /** Callback when clear is clicked */
  onClear?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when mode changes */
  onModeChange?: (mode: InteractionMode) => void;
  /** Callback when reset view is clicked */
  onResetView?: () => void;
  /** Callback when zoom in is clicked */
  onZoomIn?: () => void;
  /** Callback when zoom out is clicked */
  onZoomOut?: () => void;
  /** Callback when zoom to fit is clicked */
  onZoomToFit?: () => void;
  /** Show action buttons (delete, clear) */
  showActions?: boolean;
  /** Show tool selection (pointer, hand) */
  showTools?: boolean;
  /** Canvas state with zoom level */
  state: CanvasState;
}

// =============================================================================
// Component
// =============================================================================

export const Toolbar = memo(function Toolbar({
  className,
  mode = "selection",
  onClear,
  onDelete,
  onModeChange,
  onResetView,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  showActions = false,
  showTools = true,
  state,
}: ToolbarProps) {
  return (
    <div className={cx(toolbarStyles, className)}>
      {/* Tool Selection */}
      {showTools && (
        <>
          <HStack gap="0.5">
            <Tooltip content="Select (V)">
              <IconButton
                variant="plain"
                size="sm"
                className={mode === "selection" ? activeToolStyles : undefined}
                onClick={() => onModeChange?.("selection")}
              >
                <MousePointer2 size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Pan (Space / H)">
              <IconButton
                variant="plain"
                size="sm"
                className={mode === "grab" ? activeToolStyles : undefined}
                onClick={() => onModeChange?.("grab")}
              >
                <Hand size={16} />
              </IconButton>
            </Tooltip>
          </HStack>
          <div className={dividerStyles} />
        </>
      )}

      {/* Zoom Controls */}
      <HStack gap="0.5">
        <Tooltip content="Zoom Out (-)">
          <IconButton variant="plain" size="sm" onClick={onZoomOut}>
            <Minus size={16} />
          </IconButton>
        </Tooltip>
        <span className={zoomTextStyles}>{Math.round(state.zoom * 100)}%</span>
        <Tooltip content="Zoom In (+)">
          <IconButton variant="plain" size="sm" onClick={onZoomIn}>
            <Plus size={16} />
          </IconButton>
        </Tooltip>
      </HStack>

      <HStack gap="0.5">
        <Tooltip content="Zoom to Fit (Cmd+0)">
          <IconButton variant="plain" size="sm" onClick={onZoomToFit}>
            <Maximize size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Reset View (0)">
          <IconButton variant="plain" size="sm" onClick={onResetView}>
            <RotateCcw size={16} />
          </IconButton>
        </Tooltip>
      </HStack>

      {/* Actions */}
      {showActions && (
        <>
          <div className={dividerStyles} />
          <HStack gap="0.5">
            <Tooltip content="Delete Selected (Del)">
              <IconButton variant="plain" size="sm" onClick={onDelete}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Clear Canvas">
              <IconButton variant="plain" size="sm" onClick={onClear}>
                <Trash2 size={16} style={{ opacity: 0.5 }} />
              </IconButton>
            </Tooltip>
          </HStack>
        </>
      )}
    </div>
  );
});
