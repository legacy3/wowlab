"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { CanvasController } from "@/components/fabric";

import type { RenderOptions, TalentTreeData, TooltipData } from "./types";

import { COLORS, MAX_ZOOM, MIN_ZOOM } from "./constants";
import { renderTalentTree } from "./renderer";

// =============================================================================
// Styles
// =============================================================================

const containerStyles = css({
  "&:active": {
    cursor: "grabbing",
  },
  cursor: "grab",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  width: "100%",
});

const tooltipStyles = css({
  bg: "gray.900/98",
  border: "1px solid",
  borderColor: "gray.700",
  borderRadius: "lg",
  boxShadow: "xl",
  color: "gray.100",
  fontSize: "sm",
  lineHeight: "relaxed",
  maxW: "300px",
  p: "3",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 100,
});

// =============================================================================
// Component
// =============================================================================

export interface TalentCanvasProps {
  className?: string;
  data: TalentTreeData | null;
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  selectedHeroId?: number | null;
}

export function TalentCanvas({
  className,
  data,
  onNodeClick,
  selectedHeroId,
}: TalentCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);
  const [dimensions, setDimensions] = useState({ height: 600, width: 800 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        height: Math.floor(rect.height),
        width: Math.floor(rect.width),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Initialize canvas
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const controller = new CanvasController(element, {
      backgroundColor: "transparent",
      height: dimensions.height,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      width: dimensions.width,
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  // Update dimensions
  useEffect(() => {
    controllerRef.current?.setDimensions(dimensions.width, dimensions.height);
  }, [dimensions]);

  // Handle hover with viewport transform
  const handleHover = useCallback((data: TooltipData | null) => {
    if (!data) {
      setTooltip(null);
      return;
    }

    const controller = controllerRef.current;
    if (!controller) {
      setTooltip(data);
      return;
    }

    const vpt = controller.canvas.viewportTransform;
    const zoom = controller.canvas.getZoom();

    if (vpt) {
      setTooltip({
        ...data,
        screenX: data.screenX * zoom + vpt[4],
        screenY: data.screenY * zoom + vpt[5],
      });
    } else {
      setTooltip(data);
    }
  }, []);

  // Render talent tree when data changes
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !data) return;

    controller.clear();

    void renderTalentTree(controller.canvas, data, {
      onNodeClick,
      onNodeHover: handleHover,
      selectedHeroId,
    });
  }, [data, selectedHeroId, handleHover, onNodeClick]);

  // Current hovered entry
  const hoveredEntry = tooltip?.node.entries[tooltip.entryIndex];

  return (
    <Box ref={containerRef} className={`${containerStyles} ${className ?? ""}`}>
      <canvas ref={canvasRef} />

      {tooltip && hoveredEntry && (
        <div
          className={tooltipStyles}
          style={{
            left: tooltip.screenX + 10,
            top: tooltip.screenY,
          }}
        >
          <div
            style={{
              color: COLORS.selectionRing,
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            {hoveredEntry.name}
          </div>
          <div
            style={{ color: COLORS.textMuted }}
            dangerouslySetInnerHTML={{
              __html: hoveredEntry.description
                .replace(/\$\w+/g, "<em style='color:#facc15'>X</em>")
                .replace(
                  /\|c[a-f0-9]{8}([^|]+)\|r/gi,
                  "<em style='color:#facc15'>$1</em>",
                ),
            }}
          />
          {tooltip.node.maxRanks > 1 && (
            <div
              style={{
                color: COLORS.textMuted,
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Rank: 0/{tooltip.node.maxRanks}
            </div>
          )}
        </div>
      )}
    </Box>
  );
}
