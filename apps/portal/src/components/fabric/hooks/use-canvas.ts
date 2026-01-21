"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasConfig, CanvasState } from "../core/types";

import { CanvasController } from "../core/controller";

// =============================================================================
// Types
// =============================================================================

export interface UseCanvasOptions extends CanvasConfig {
  onReady?: (controller: CanvasController) => void;
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  clear: () => void;
  controller: CanvasController | null;
  deleteSelected: () => void;
  resetView: () => void;
  state: CanvasState;
}

const DEFAULT_STATE: CanvasState = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

// =============================================================================
// Hook
// =============================================================================

export function useCanvas(options: UseCanvasOptions): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);
  const [state, setState] = useState<CanvasState>(DEFAULT_STATE);

  // Initialize
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const controller = new CanvasController(element, options);
    controller.setStateListener(setState);
    controllerRef.current = controller;

    options.onReady?.(controller);

    return () => {
      void controller.dispose();
      controllerRef.current = null;
    };
  }, []); // Only run once on mount

  // Update dimensions
  useEffect(() => {
    controllerRef.current?.setDimensions(options.width, options.height);
  }, [options.width, options.height]);

  const resetView = useCallback(() => {
    controllerRef.current?.resetView();
  }, []);

  const deleteSelected = useCallback(() => {
    controllerRef.current?.deleteSelected();
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.clear();
  }, []);

  return {
    canvasRef,
    clear,
    controller: controllerRef.current,
    deleteSelected,
    resetView,
    state,
  };
}
