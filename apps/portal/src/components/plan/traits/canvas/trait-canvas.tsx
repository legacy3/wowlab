"use client";

import { useCallback, useState } from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import type { SpecTraits } from "@/lib/supabase/types";

import {
  type CanvasController,
  type InteractionMode,
  InteractionPlugin,
  useCanvas,
  useCanvasContainer,
  ZoomPlugin,
} from "@/components/fabric";
import { useTraitStore } from "@/lib/state/traits";

import type { TooltipData } from "../renderer/types";

import { DebugModal } from "../debug";
import { PointCounter, TraitToolbar, TraitTooltip } from "../ui";
import { useTraitCanvas } from "./use-trait-canvas";

const containerStyles = css({
  bg: "bg.canvas",
  flex: "1",
  overflow: "hidden",
  position: "relative",
  w: "100%",
});

const toolbarWrapperStyles = css({
  left: "50%",
  position: "absolute",
  top: "3",
  transform: "translateX(-50%)",
  zIndex: 10,
});

const leftControlsStyles = css({
  left: "3",
  position: "absolute",
  top: "3",
  zIndex: 10,
});

const rightControlsStyles = css({
  position: "absolute",
  right: "3",
  top: "3",
  zIndex: 10,
});

interface TraitCanvasProps {
  specTraits: SpecTraits;
}

export function TraitCanvas({ specTraits }: TraitCanvasProps) {
  const {
    containerRef,
    controllerRef,
    dimensions,
    isReady,
    setIsReady,
    transformTooltip,
  } = useCanvasContainer();

  const nodes = useTraitStore((s) => s.treeData.nodes);
  const subTrees = useTraitStore((s) => s.treeData.subTrees);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mode, setMode] = useState<InteractionMode>("grab");

  const handleTooltip = useCallback(
    (data: TooltipData | null) => {
      setTooltip(data ? transformTooltip(data) : null);
    },
    [transformTooltip],
  );

  const { handleReady: baseHandleReady } = useTraitCanvas({
    onModeChange: setMode,
    onTooltip: handleTooltip,
    specTraits,
  });

  const handleReady = useCallback(
    (controller: CanvasController) => {
      baseHandleReady(controller);
      controllerRef.current = controller;
      setIsReady(true);
    },
    [baseHandleReady, controllerRef, setIsReady],
  );

  const { canvasRef, resetView, state } = useCanvas({
    backgroundColor: "transparent",
    height: dimensions.height,
    onReady: handleReady,
    width: dimensions.width,
  });

  const handleModeChange = useCallback(
    (newMode: InteractionMode) => {
      const controller = controllerRef.current;
      if (!controller) {
        return;
      }
      const interaction =
        controller.plugins.get<InteractionPlugin>("interaction");
      if (interaction) {
        interaction.setMode(newMode);
      }
    },
    [controllerRef],
  );

  const handleZoomIn = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomIn();
  }, [controllerRef]);

  const handleZoomOut = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomOut();
  }, [controllerRef]);

  const handleZoomToFit = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomToFit(80);
  }, [controllerRef]);

  const handleExport = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      const dataUrl = controller.toDataURL("png");
      const link = document.createElement("a");
      link.download = "trait-tree.png";
      link.href = dataUrl;
      link.click();
    }
  }, [controllerRef]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return (
    <div className={containerStyles} ref={containerRef}>
      <div className={leftControlsStyles}>
        <PointCounter />
      </div>

      <div className={rightControlsStyles}>
        <DebugModal nodes={nodes} subTrees={subTrees} />
      </div>

      <div className={toolbarWrapperStyles}>
        <TraitToolbar
          mode={mode}
          state={state}
          onExport={handleExport}
          onModeChange={handleModeChange}
          onResetView={resetView}
          onShare={handleShare}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={handleZoomToFit}
        />
      </div>

      <Box position="absolute" inset="0">
        <canvas ref={canvasRef} />
      </Box>

      {tooltip && <TraitTooltip data={tooltip} />}
    </div>
  );
}
