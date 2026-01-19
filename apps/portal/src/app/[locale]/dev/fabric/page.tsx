"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { Box, HStack } from "styled-system/jsx";

import {
  type CanvasController,
  ClipboardPlugin,
  ControlsPlugin,
  GuidelinesPlugin,
  HistoryPlugin,
  ShortcutsPlugin,
  Toolbar,
  useCanvas,
  useCanvasContainer,
} from "@/components/fabric";
import { SpecPicker } from "@/components/game/spec-picker";
import {
  COLORS,
  renderTalentTree,
  type TalentTreeData,
  type TooltipData,
} from "@/components/talent-tree";
import { IconButton, Tooltip as UITooltip } from "@/components/ui";
import { useSpecTraits } from "@/lib/state";

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
  left: "50%",
  position: "absolute",
  top: "3",
  transform: "translateX(-50%)",
  zIndex: 10,
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

const specPickerWrapperStyles = css({
  left: "3",
  position: "absolute",
  top: "3",
  zIndex: 10,
});

// =============================================================================
// Page
// =============================================================================

export default function TalentTreePage() {
  const {
    containerRef,
    controllerRef,
    dimensions,
    isReady,
    setIsReady,
    transformTooltip,
  } = useCanvasContainer();
  const [specId, setSpecId] = useState<number>(253);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { data: specTraits } = useSpecTraits(specId);

  const handleHover = useCallback(
    (data: TooltipData | null) => {
      setTooltip(transformTooltip(data));
    },
    [transformTooltip],
  );

  const handleReady = useCallback(
    (controller: CanvasController) => {
      controller
        .use(new ShortcutsPlugin())
        .use(new HistoryPlugin())
        .use(new ClipboardPlugin())
        .use(new GuidelinesPlugin())
        .use(new ControlsPlugin());

      controllerRef.current = controller;
      setIsReady(true);
    },
    [controllerRef, setIsReady],
  );

  // Render talent tree when data changes
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !specTraits || !isReady) return;

    controller.clear();

    const treeData: TalentTreeData = {
      edges: specTraits.edges as unknown as TalentTreeData["edges"],
      nodes: specTraits.nodes as unknown as TalentTreeData["nodes"],
      subTrees: specTraits.sub_trees as unknown as TalentTreeData["subTrees"],
    };

    void renderTalentTree(controller.canvas, treeData, {
      onNodeHover: handleHover,
      selectedHeroId: null,
    });
  }, [controllerRef, specTraits, isReady, handleHover]);

  const {
    canvasRef,
    clear,
    deleteSelected,
    resetView,
    state,
    zoomIn,
    zoomOut,
  } = useCanvas({
    backgroundColor: "transparent",
    height: dimensions.height,
    onReady: handleReady,
    width: dimensions.width,
  });

  const handleExport = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      const dataUrl = controller.toDataURL("png");
      const link = document.createElement("a");
      link.download = "talent-tree.png";
      link.href = dataUrl;
      link.click();
    }
  }, [controllerRef]);

  const hoveredEntry = tooltip?.node.entries[tooltip.entryIndex];

  return (
    <div className={containerStyles} ref={containerRef}>
      {/* Spec picker */}
      <div className={specPickerWrapperStyles}>
        <HStack gap="2">
          <SpecPicker compact specId={specId} onSelect={setSpecId} />
          <UITooltip content="Export PNG">
            <IconButton variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} />
            </IconButton>
          </UITooltip>
        </HStack>
      </div>

      {/* Toolbar */}
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

      {/* Canvas */}
      <Box position="absolute" inset="0">
        <canvas ref={canvasRef} />
      </Box>

      {/* Tooltip */}
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
    </div>
  );
}
