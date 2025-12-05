import { useCallback, useState, useRef, useEffect } from "react";
import type Konva from "konva";

export interface ZoomState {
  scale: number;
  x: number;
}

interface UseZoomParams {
  totalDuration: number;
  innerWidth: number;
  initialWindow?: number;
  minScale?: number;
  maxScale?: number;
}

interface UseZoomReturn {
  zoomState: ZoomState;
  setZoomState: React.Dispatch<React.SetStateAction<ZoomState>>;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitAll: () => void;
  zoomToRange: (start: number, end: number) => void;
}

export function useZoom({
  totalDuration,
  innerWidth,
  initialWindow = 60,
  minScale = 1,
  maxScale = 50,
}: UseZoomParams): UseZoomReturn {
  // Calculate initial scale factor (how much to zoom in to show initialWindow)
  const initialScale = Math.max(1, totalDuration / initialWindow);

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: initialScale,
    x: 0,
  });

  // Ref for smooth animation - cleanup on unmount to prevent RAF leak
  const animationRef = useRef<number | null>(null);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle wheel zoom (pointer-centric)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.05;

      setZoomState((prev) => {
        const oldScale = prev.scale;

        // Calculate pointer position in the data space
        const mousePointTo = (pointer.x - prev.x) / oldScale;

        // Determine zoom direction
        let direction = e.evt.deltaY > 0 ? -1 : 1;

        // When we zoom on trackpad, e.evt.ctrlKey is true
        if (e.evt.ctrlKey) {
          direction = -direction;
        }

        const newScale = Math.min(
          maxScale,
          Math.max(
            minScale,
            direction > 0 ? oldScale * scaleBy : oldScale / scaleBy,
          ),
        );

        // Calculate new position to keep pointer at same data point
        const newX = pointer.x - mousePointTo * newScale;

        // Constrain panning to valid range
        const maxX = 0;
        const minX = -(innerWidth * newScale - innerWidth);

        return {
          scale: newScale,
          x: Math.min(maxX, Math.max(minX, newX)),
        };
      });
    },
    [innerWidth, minScale, maxScale],
  );

  // Animate zoom to target - uses functional setState to avoid stale closures
  const animateZoom = useCallback(
    (targetScale: number, targetX: number, duration = 200) => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      // Capture starting values at animation start
      let startScale: number | null = null;
      let startX: number | null = null;
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (startTime === null) {
          startTime = currentTime;
          // Get current state at animation start
          setZoomState((prev) => {
            startScale = prev.scale;
            startX = prev.x;
            return prev;
          });
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        if (startScale === null || startX === null) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);

        const newScale = startScale + (targetScale - startScale) * eased;
        const newX = startX + (targetX - startX) * eased;

        setZoomState({ scale: newScale, x: newX });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [],
  );

  const zoomIn = useCallback(() => {
    const newScale = Math.min(maxScale, zoomState.scale * 2);
    // Zoom toward center
    const centerX = innerWidth / 2;
    const mousePointTo = (centerX - zoomState.x) / zoomState.scale;
    const newX = centerX - mousePointTo * newScale;

    const maxX = 0;
    const minX = -(innerWidth * newScale - innerWidth);

    animateZoom(newScale, Math.min(maxX, Math.max(minX, newX)));
  }, [zoomState, innerWidth, maxScale, animateZoom]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(minScale, zoomState.scale * 0.5);
    // Zoom from center
    const centerX = innerWidth / 2;
    const mousePointTo = (centerX - zoomState.x) / zoomState.scale;
    const newX = centerX - mousePointTo * newScale;

    const maxX = 0;
    const minX = -(innerWidth * newScale - innerWidth);

    animateZoom(newScale, Math.min(maxX, Math.max(minX, newX)));
  }, [zoomState, innerWidth, minScale, animateZoom]);

  const resetZoom = useCallback(() => {
    animateZoom(initialScale, 0, 300);
  }, [initialScale, animateZoom]);

  const fitAll = useCallback(() => {
    animateZoom(1, 0, 300);
  }, [animateZoom]);

  const zoomToRange = useCallback(
    (start: number, end: number) => {
      if (innerWidth <= 0) return;

      // Calculate the scale factor needed to show this range
      const rangeSize = end - start;
      const newScale = totalDuration / rangeSize;

      // Calculate the x translation to position the start at the left edge
      const newX = -(start / totalDuration) * innerWidth * newScale;

      const maxX = 0;
      const minX = -(innerWidth * newScale - innerWidth);

      setZoomState({
        scale: Math.min(maxScale, Math.max(minScale, newScale)),
        x: Math.min(maxX, Math.max(minX, newX)),
      });
    },
    [innerWidth, totalDuration, minScale, maxScale],
  );

  return {
    zoomState,
    setZoomState,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    fitAll,
    zoomToRange,
  };
}
