"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasController } from "../core/controller";

// =============================================================================
// Types
// =============================================================================

export interface TooltipPosition {
  screenX: number;
  screenY: number;
}

export interface UseCanvasContainerReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  controllerRef: React.MutableRefObject<CanvasController | null>;
  dimensions: { height: number; width: number };
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
  transformTooltip: <T extends TooltipPosition>(data: T | null) => T | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useCanvasContainer(): UseCanvasContainerReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);
  const [dimensions, setDimensions] = useState({ height: 600, width: 800 });
  const [isReady, setIsReady] = useState(false);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        height: Math.floor(rect.height),
        width: Math.floor(rect.width),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Transform tooltip position based on viewport
  const transformTooltip = useCallback(
    <T extends TooltipPosition>(data: T | null): T | null => {
      if (!data) return null;

      const controller = controllerRef.current;
      if (!controller) return data;

      const vpt = controller.canvas.viewportTransform;
      const zoom = controller.canvas.getZoom();

      if (vpt) {
        return {
          ...data,
          screenX: data.screenX * zoom + vpt[4],
          screenY: data.screenY * zoom + vpt[5],
        };
      }

      return data;
    },
    [],
  );

  return {
    containerRef,
    controllerRef,
    dimensions,
    isReady,
    setIsReady,
    transformTooltip,
  };
}
