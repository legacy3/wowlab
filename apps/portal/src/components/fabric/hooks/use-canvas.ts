"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasConfig, CanvasState } from "../core/types";

import { CanvasController } from "../core/controller";

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

export function useCanvas(options: UseCanvasOptions): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);
  const [state, setState] = useState<CanvasState>(DEFAULT_STATE);
  const [controller, setController] = useState<CanvasController | null>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) {
      return;
    }

    const newController = new CanvasController(element, options);
    newController.setStateListener(setState);
    controllerRef.current = newController;
    setController(newController);

    options.onReady?.(newController);

    return () => {
      void newController.dispose();
      controllerRef.current = null;
      setController(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Initialize once on mount, options changes handled separately
  }, []);

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
    controller,
    deleteSelected,
    resetView,
    state,
  };
}
