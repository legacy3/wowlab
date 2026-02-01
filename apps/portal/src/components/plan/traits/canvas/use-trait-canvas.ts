"use client";

import { useLatest, useMemoizedFn, useTimeout } from "ahooks";
import { useEffect, useRef, useState } from "react";

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
  const onTooltipRef = useLatest(onTooltip);
  const [shouldZoomToFit, setShouldZoomToFit] = useState(false);

  const selection = useTraitStore((s) => s.selection);

  // Use useTimeout for safe cleanup instead of raw setTimeout
  useTimeout(
    () => {
      const controller = controllerRef.current;
      const zoomPlugin = controller?.plugins.get<ZoomPlugin>("zoom");
      zoomPlugin?.zoomToFit(80);
      setShouldZoomToFit(false);
    },
    shouldZoomToFit ? 100 : undefined,
  );

  useEffect(() => {
    const treeData = transformSpecTraits(specTraits);
    treeDataRef.current = treeData;
    useTraitStore.getState().loadTree(treeData);
  }, [specTraits]);

  const handleReady = useMemoizedFn((controller: CanvasController) => {
    controller
      .use(new ShortcutsPlugin())
      .use(new InteractionPlugin({ defaultMode: "grab" }))
      .use(new ZoomPlugin());

    controller.events.on("interaction:change", ({ mode: newMode }) => {
      onModeChange?.(newMode);
    });

    controllerRef.current = controller;
  });

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
      setShouldZoomToFit(true);
    });
  }, [onTooltipRef, selection]);

  return {
    handleReady,
  };
}
