"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SpecTraits } from "@/lib/supabase/types";

import {
  type CanvasController,
  type InteractionMode,
  InteractionPlugin,
  ShortcutsPlugin,
  ZoomPlugin,
} from "@/components/fabric";
import { useTraitStore } from "@/lib/state/traits";
import {
  buildEdgeMaps,
  getEdgeState,
  getNodeState,
  type TraitTreeFlat,
  transformSpecTraits,
} from "@/lib/trait";

import type { TooltipData } from "../renderer/types";

import { renderTraitTree } from "../renderer";

export interface UseTraitCanvasOptions {
  onModeChange?: (mode: InteractionMode) => void;
  onTooltip?: (data: TooltipData | null) => void;
  specTraits: SpecTraits;
}

export interface UseTraitCanvasReturn {
  handleReady: (controller: CanvasController) => void;
}

export function useTraitCanvas({
  onModeChange,
  onTooltip,
  specTraits,
}: UseTraitCanvasOptions): UseTraitCanvasReturn {
  const controllerRef = useRef<CanvasController | null>(null);
  const treeDataRef = useRef<TraitTreeFlat | null>(null);
  const onTooltipRef = useRef(onTooltip);

  const selection = useTraitStore((s) => s.selection);

  // Update ref in effect to avoid accessing during render
  useEffect(() => {
    onTooltipRef.current = onTooltip;
  }, [onTooltip]);

  useEffect(() => {
    const treeData = transformSpecTraits(specTraits);
    treeDataRef.current = treeData;
    useTraitStore.getState().loadTree(treeData);
  }, [specTraits]);

  const handleReady = useCallback(
    (controller: CanvasController) => {
      controller
        .use(new ShortcutsPlugin())
        .use(new InteractionPlugin({ defaultMode: "grab" }))
        .use(new ZoomPlugin());

      controller.events.on("interaction:change", ({ mode: newMode }) => {
        onModeChange?.(newMode);
      });

      controllerRef.current = controller;
    },
    [onModeChange],
  );

  useEffect(() => {
    const controller = controllerRef.current;
    const treeData = treeDataRef.current;

    if (!controller || !treeData) {
      return;
    }

    const { incoming } = buildEdgeMaps(treeData.edges);
    const store = useTraitStore.getState();

    controller.clear();

    void renderTraitTree(controller.canvas, treeData, {
      getEdgeState: (fromId, toId) => getEdgeState(fromId, toId, selection),
      getNodeSelection: (nodeId) => store.getNodeSelection(nodeId),
      getNodeState: (nodeId) => {
        const node = treeData.nodes.find((n) => n.id === nodeId);
        if (!node) {
          return "locked";
        }

        return getNodeState(node, selection, incoming);
      },
      onNodeHover: (data) => onTooltipRef.current?.(data),
      onNodePurchase: (nodeId, entryIndex) => {
        useTraitStore.getState().purchaseNode(nodeId, entryIndex);
      },
      onNodeRefund: (nodeId) => {
        useTraitStore.getState().refundNode(nodeId);
      },
      selection,
    }).then(() => {
      const zoomPlugin = controller.plugins.get<ZoomPlugin>("zoom");
      if (zoomPlugin) {
        setTimeout(() => zoomPlugin.zoomToFit(80), 100);
      }
    });
  }, [selection]);

  return {
    handleReady,
  };
}
