"use client";

import { useCallback, useEffect, useRef } from "react";

import { CanvasController } from "@/components/fabric";

import type { TalentTreeData, TooltipData } from "../types";

import { MAX_ZOOM, MIN_ZOOM } from "../constants";
import { renderTalentTree } from "../renderer/render-tree";

export interface TalentCanvasProps {
  data: TalentTreeData | null;
  dimensions: { height: number; width: number };
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  onNodeHover?: (data: TooltipData | null) => void;
  selectedHeroId?: number | null;
}

/**
 * Pure canvas component that handles Fabric.js lifecycle and rendering.
 * Does not manage tooltip display - that's handled by the parent.
 */
export function TalentCanvas({
  data,
  dimensions,
  onNodeClick,
  onNodeHover,
  selectedHeroId,
}: TalentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);

  // Transform hover coordinates from canvas space to screen space
  const handleHover = useCallback(
    (hoverData: TooltipData | null) => {
      if (!hoverData) {
        onNodeHover?.(null);
        return;
      }

      const controller = controllerRef.current;
      if (!controller) {
        onNodeHover?.(hoverData);
        return;
      }

      const vpt = controller.canvas.viewportTransform;
      const zoom = controller.canvas.getZoom();

      if (vpt) {
        onNodeHover?.({
          ...hoverData,
          screenX: hoverData.screenX * zoom + vpt[4],
          screenY: hoverData.screenY * zoom + vpt[5],
        });
      } else {
        onNodeHover?.(hoverData);
      }
    },
    [onNodeHover],
  );

  // Initialize canvas controller
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

  // Update dimensions when container resizes
  useEffect(() => {
    controllerRef.current?.setDimensions(dimensions.width, dimensions.height);
  }, [dimensions]);

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

  return <canvas ref={canvasRef} />;
}
