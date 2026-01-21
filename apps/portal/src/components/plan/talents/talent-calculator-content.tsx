"use client";

import { Download, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";

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
import { IconButton, Tooltip as UITooltip } from "@/components/ui";
import { routes } from "@/lib/routing";
import { useSpecTraits } from "@/lib/state";

import type { TalentSubTree } from "./talent-tree";

import { SpellDescriptionViewer } from "./spell-description-diff";
import {
  renderTalentTree,
  TalentTooltip,
  type TalentTreeData,
  type TooltipData,
} from "./talent-tree";

// =============================================================================
// Styles
// =============================================================================

const containerStyles = css({
  bg: "bg.canvas",
  display: "flex",
  flexDir: "column",
  h: "calc(100vh - 200px)",
  minH: "600px",
  overflow: "hidden",
  position: "relative",
  rounded: "lg",
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
    <VStack gap="4" w="full">
      <TalentTreeView specId={specId} />
      <DescriptionDiffBox specId={specId} />
    </VStack>
  );
}

function DescriptionDiffBox({ specId }: { specId: number }) {
  const { data: specTraits } = useSpecTraits(specId);
  if (!specTraits) {
    return null;
  }

  return (
    <SpellDescriptionViewer
      nodes={specTraits.nodes as unknown as TalentTreeData["nodes"]}
      subTrees={specTraits.sub_trees as unknown as TalentSubTree[]}
    />
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
      {tooltip && <TalentTooltip data={tooltip} />}
    </div>
  );
}
