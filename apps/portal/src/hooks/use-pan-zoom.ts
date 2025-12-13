import { useCallback, useRef, useState } from "react";

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

interface UsePanZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export function usePanZoom({
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
}: UsePanZoomOptions = {}) {
  const [state, setState] = useState<PanZoomState>({
    x: 0,
    y: 0,
    scale: initialScale,
  });

  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const scaleBy = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;

      setState((prev) => {
        const newScale = Math.min(
          maxScale,
          Math.max(
            minScale,
            direction > 0 ? prev.scale * scaleBy : prev.scale / scaleBy,
          ),
        );

        // Zoom toward pointer position
        const scaleRatio = newScale / prev.scale;
        const newX = pointerX - (pointerX - prev.x) * scaleRatio;
        const newY = pointerY - (pointerY - prev.y) * scaleRatio;

        return { x: newX, y: newY, scale: newScale };
      });
    },
    [minScale, maxScale],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) {
      return; // Left click only
    }

    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = "grabbing";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !lastPos.current) {
      return;
    }

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    lastPos.current = { x: e.clientX, y: e.clientY };

    setState((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = false;
    lastPos.current = null;
    e.currentTarget.style.cursor = "grab";
  }, []);

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging.current) {
        isDragging.current = false;
        lastPos.current = null;
        e.currentTarget.style.cursor = "grab";
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ x: 0, y: 0, scale: initialScale });
  }, [initialScale]);

  return {
    state,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
    reset,
  };
}
