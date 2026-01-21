"use client";

import {
  Download,
  Hand,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Share2,
  Undo2,
} from "lucide-react";
import { memo, useCallback } from "react";
import { css, cx } from "styled-system/css";
import { HStack } from "styled-system/jsx";

import type { CanvasState, InteractionMode } from "@/components/fabric";

import { IconButton, Tooltip } from "@/components/ui";
import { useHistoryState, useTraitStore } from "@/lib/state/traits";

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

export interface TraitToolbarProps {
  className?: string;
  mode?: InteractionMode;
  onExport?: () => void;
  onModeChange?: (mode: InteractionMode) => void;
  onResetView?: () => void;
  onShare?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  state: CanvasState;
}

export const TraitToolbar = memo(function TraitToolbar({
  className,
  mode = "grab",
  onExport,
  onModeChange,
  onResetView,
  onShare,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  state,
}: TraitToolbarProps) {
  const { canRedo, canUndo } = useHistoryState();
  const undo = useTraitStore((s) => s.undo);
  const redo = useTraitStore((s) => s.redo);

  const handleUndo = useCallback(() => undo(), [undo]);
  const handleRedo = useCallback(() => redo(), [redo]);

  return (
    <div className={cx(toolbarStyles, className)}>
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

      <HStack gap="0.5">
        <Tooltip content="Undo (Cmd+Z)">
          <IconButton
            variant="plain"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo2 size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Redo (Cmd+Shift+Z)">
          <IconButton
            variant="plain"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo2 size={16} />
          </IconButton>
        </Tooltip>
      </HStack>

      <div className={dividerStyles} />

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

      <div className={dividerStyles} />

      <HStack gap="0.5">
        <Tooltip content="Share Link">
          <IconButton variant="plain" size="sm" onClick={onShare}>
            <Share2 size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Export PNG">
          <IconButton variant="plain" size="sm" onClick={onExport}>
            <Download size={16} />
          </IconButton>
        </Tooltip>
      </HStack>
    </div>
  );
});
