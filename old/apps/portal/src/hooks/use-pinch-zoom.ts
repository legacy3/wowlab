import { useCallback, useRef } from "react";

interface UsePinchZoomOptions {
  minScale: number;
  maxScale: number;
  onZoom: (scale: number, centerX: number, centerY: number) => void;
}

interface UsePinchZoomReturn {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  isPinching: boolean;
}

function getDistance(touches: TouchList): number {
  const [t1, t2] = [touches[0], touches[1]];
  if (!t1 || !t2) {
    return 0;
  }

  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;

  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(touches: TouchList): { x: number; y: number } {
  const [t1, t2] = [touches[0], touches[1]];
  if (!t1 || !t2) {
    return { x: 0, y: 0 };
  }

  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

export function usePinchZoom(
  currentScale: number,
  options: UsePinchZoomOptions,
): UsePinchZoomReturn {
  const { minScale, maxScale, onZoom } = options;

  const pinchRef = useRef<{
    active: boolean;
    initialDistance: number;
    initialScale: number;
  }>({
    active: false,
    initialDistance: 0,
    initialScale: 1,
  });

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = {
          active: true,
          initialDistance: getDistance(e.touches),
          initialScale: currentScale,
        };
      }
    },
    [currentScale],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pinchRef.current.active || e.touches.length !== 2) {
        return;
      }

      const distance = getDistance(e.touches);
      const center = getCenter(e.touches);
      const scaleFactor = distance / pinchRef.current.initialDistance;
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, pinchRef.current.initialScale * scaleFactor),
      );

      onZoom(newScale, center.x, center.y);
    },
    [maxScale, minScale, onZoom],
  );

  const onTouchEnd = useCallback(() => {
    pinchRef.current.active = false;
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPinching: pinchRef.current.active,
  };
}
