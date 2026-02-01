"use client";

import { useSize } from "ahooks";
import { useCallback, useRef, useState } from "react";

import type { CanvasController } from "../core/controller";

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

export function useCanvasContainer(): UseCanvasContainerReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);
  const [isReady, setIsReady] = useState(false);

  const size = useSize(containerRef);
  const dimensions = {
    height: size?.height ? Math.floor(size.height) : 600,
    width: size?.width ? Math.floor(size.width) : 800,
  };

  const transformTooltip = useCallback(
    <T extends TooltipPosition>(data: T | null): T | null => {
      if (!data) {
        return null;
      }

      const controller = controllerRef.current;
      if (!controller) {
        return data;
      }

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
