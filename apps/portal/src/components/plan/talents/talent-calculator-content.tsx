"use client";

import { Download, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { Box, Flex, HStack } from "styled-system/jsx";

import {
  type CanvasController,
  ClipboardPlugin,
  ControlsPlugin,
  GuidelinesPlugin,
  HistoryPlugin,
  type InteractionMode,
  InteractionPlugin,
  ShortcutsPlugin,
  Toolbar,
  useCanvas,
  useCanvasContainer,
  ZoomPlugin,
} from "@/components/fabric";
import { IconButton, Tooltip as UITooltip } from "@/components/ui";
import { routes } from "@/lib/routing";
import { useSpecTraits } from "@/lib/state";

import { DebugModal } from "./debug";
import {
  renderTalentTree,
  type TalentSubTree,
  TalentTooltip,
  type TalentTreeData,
  type TooltipData,
} from "./talent-tree";

// =============================================================================
// Styles
// =============================================================================

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

const controlsWrapperStyles = css({
  left: "3",
  position: "absolute",
  top: "3",
  zIndex: 10,
});

// =============================================================================
// Main Component
// =============================================================================

interface TalentCalculatorContentProps {
  specId: number;
}

export function TalentCalculatorContent({
  specId,
}: TalentCalculatorContentProps) {
  return (
    <Flex flexDirection="column" h="100vh" overflow="hidden">
      <TalentTreeView specId={specId} />
    </Flex>
  );
}

// =============================================================================
// Tree View
// =============================================================================

function TalentTreeView({ specId }: { specId: number }) {
  const {
    containerRef,
    controllerRef,
    dimensions,
    isReady,
    setIsReady,
    transformTooltip,
  } = useCanvasContainer();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mode, setMode] = useState<InteractionMode>("grab");

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
        .use(new InteractionPlugin({ defaultMode: "grab" }))
        .use(new ZoomPlugin())
        .use(new HistoryPlugin())
        .use(new ClipboardPlugin())
        .use(new GuidelinesPlugin())
        .use(new ControlsPlugin());

      // Listen for mode changes from shortcuts
      controller.events.on("interaction:change", ({ mode: newMode }) => {
        setMode(newMode);
      });

      controllerRef.current = controller;
      setIsReady(true);
    },
    [controllerRef, setIsReady],
  );

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

    // Zoom to fit after rendering
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    if (zoomPlugin) {
      setTimeout(() => zoomPlugin.zoomToFit(80), 100);
    }
  }, [controllerRef, specTraits, isReady, handleHover]);

  const { canvasRef, resetView, state } = useCanvas({
    backgroundColor: "transparent",
    height: dimensions.height,
    onReady: handleReady,
    width: dimensions.width,
  });

  const handleModeChange = useCallback(
    (newMode: InteractionMode) => {
      const controller = controllerRef.current;
      if (!controller) return;
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
    if (!controller) return;
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomIn();
  }, [controllerRef]);

  const handleZoomOut = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomOut();
  }, [controllerRef]);

  const handleZoomToFit = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
    zoomPlugin?.zoomToFit(80);
  }, [controllerRef]);

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

  return (
    <div className={containerStyles} ref={containerRef}>
      {/* Controls */}
      <div className={controlsWrapperStyles}>
        <HStack gap="2">
          <UITooltip content="Close">
            <IconButton variant="outline" size="sm" asChild>
              <Link href={routes.plan.talents.path}>
                <X size={16} />
              </Link>
            </IconButton>
          </UITooltip>
          <UITooltip content="Export PNG">
            <IconButton variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} />
            </IconButton>
          </UITooltip>
          {specTraits && (
            <DebugModal
              nodes={specTraits.nodes as unknown as TalentTreeData["nodes"]}
              subTrees={specTraits.sub_trees as unknown as TalentSubTree[]}
            />
          )}
        </HStack>
      </div>

      {/* Toolbar */}
      <div className={toolbarWrapperStyles}>
        <Toolbar
          mode={mode}
          state={state}
          onModeChange={handleModeChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={handleZoomToFit}
          onResetView={resetView}
        />
      </div>

      {/* Canvas */}
      <Box position="absolute" inset="0">
        <canvas ref={canvasRef} />
      </Box>

      {/* Tooltip */}
      {tooltip && <TalentTooltip data={tooltip} />}
    </div>
  );
}
