"use client";

import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import {
  type CanvasController,
  ShortcutsPlugin,
  Toolbar,
  useCanvas,
  useCanvasContainer,
} from "@/components/fabric";
import {
  COLORS,
  renderTimeline,
  type TimelineData,
  type TimelineTooltipData,
} from "@/components/timeline-canvas";

// =============================================================================
// Demo Data
// =============================================================================

const DEMO_TIMELINE: TimelineData = {
  duration: 30000,
  events: [
    // Cooldowns track
    { color: "#ef4444", duration: 15000, id: "1", name: "Bestial Wrath", startTime: 0, track: 0 },
    { color: "#ef4444", duration: 15000, id: "2", name: "Bestial Wrath", startTime: 18000, track: 0 },

    // Buffs track
    { color: "#f97316", duration: 10000, id: "3", name: "Bloodlust", startTime: 0, track: 1 },
    { color: "#a855f7", duration: 12000, id: "4", name: "Aspect of the Wild", startTime: 12000, track: 1 },

    // Damage track
    { color: "#22c55e", duration: 1500, id: "5", name: "Kill Command", startTime: 0, track: 2 },
    { color: "#eab308", duration: 1000, id: "6", name: "Cobra Shot", startTime: 2000, track: 2 },
    { color: "#22c55e", duration: 1500, id: "7", name: "Kill Command", startTime: 6000, track: 2 },
    { color: "#eab308", duration: 1000, id: "8", name: "Cobra Shot", startTime: 8000, track: 2 },
    { color: "#22c55e", duration: 1500, id: "9", name: "Kill Command", startTime: 12000, track: 2 },
    { color: "#eab308", duration: 1000, id: "10", name: "Cobra Shot", startTime: 14000, track: 2 },
    { color: "#22c55e", duration: 1500, id: "11", name: "Kill Command", startTime: 18000, track: 2 },
    { color: "#eab308", duration: 1000, id: "12", name: "Cobra Shot", startTime: 20000, track: 2 },

    // Movement track
    { color: "#3b82f6", duration: 500, id: "13", name: "Disengage", startTime: 5000, track: 3 },
    { color: "#3b82f6", duration: 500, id: "14", name: "Disengage", startTime: 18000, track: 3 },
  ],
  tracks: ["Cooldowns", "Buffs", "Damage", "Movement"],
};

// =============================================================================
// Styles
// =============================================================================

const containerStyles = css({
  bg: "bg.canvas",
  display: "flex",
  flexDir: "column",
  h: "calc(100vh - 64px)",
  overflow: "hidden",
  position: "relative",
  w: "100%",
});

const toolbarWrapperStyles = css({
  bottom: "3",
  left: "3",
  position: "absolute",
  zIndex: 10,
});

const tooltipStyles = css({
  bg: "gray.900/98",
  border: "1px solid",
  borderColor: "gray.700",
  borderRadius: "md",
  boxShadow: "lg",
  color: "gray.100",
  fontSize: "xs",
  p: "2",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 100,
});

// =============================================================================
// Page
// =============================================================================

export default function TimelineDemoPage() {
  const { containerRef, controllerRef, dimensions, isReady, setIsReady, transformTooltip } =
    useCanvasContainer();
  const [tooltip, setTooltip] = useState<TimelineTooltipData | null>(null);

  const handleHover = useCallback(
    (data: TimelineTooltipData | null) => {
      setTooltip(transformTooltip(data));
    },
    [transformTooltip],
  );

  const handleReady = useCallback(
    (controller: CanvasController) => {
      controller.use(new ShortcutsPlugin());
      controllerRef.current = controller;
      setIsReady(true);
    },
    [controllerRef, setIsReady],
  );

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !isReady) return;

    controller.clear();
    renderTimeline(controller.canvas, DEMO_TIMELINE, { onEventHover: handleHover });
  }, [controllerRef, isReady, handleHover]);

  const { canvasRef, clear, deleteSelected, resetView, state, zoomIn, zoomOut } = useCanvas({
    backgroundColor: "transparent",
    height: dimensions.height,
    onReady: handleReady,
    width: dimensions.width,
  });

  return (
    <div className={containerStyles} ref={containerRef}>
      <div className={toolbarWrapperStyles}>
        <Toolbar
          state={state}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
          onDelete={deleteSelected}
          onClear={clear}
        />
      </div>

      <Box position="absolute" inset="0">
        <canvas ref={canvasRef} />
      </Box>

      {tooltip && (
        <div className={tooltipStyles} style={{ left: tooltip.screenX + 10, top: tooltip.screenY }}>
          <div style={{ color: tooltip.event.color, fontWeight: 600 }}>{tooltip.event.name}</div>
          <div style={{ color: COLORS.text, marginTop: 2 }}>
            {(tooltip.event.startTime / 1000).toFixed(1)}s —{" "}
            {((tooltip.event.startTime + tooltip.event.duration) / 1000).toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  );
}
