import { useCallback, useRef } from "react";
import type Konva from "konva";
import type { ZoomState } from "./use-zoom";

interface UseDragPanParams {
  stageRef: React.RefObject<Konva.Stage | null>;
  innerWidth: number;
  setZoomState: React.Dispatch<React.SetStateAction<ZoomState>>;
}

interface UseDragPanReturn {
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: () => void;
}

export function useDragPan({
  stageRef,
  innerWidth,
  setZoomState,
}: UseDragPanParams): UseDragPanReturn {
  const isDragging = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  const updatePan = useCallback(
    (dx: number) => {
      setZoomState((prev) => {
        const maxX = 0;
        const minX = -(innerWidth * prev.scale - innerWidth);
        return {
          ...prev,
          x: Math.min(maxX, Math.max(minX, prev.x + dx)),
        };
      });
    },
    [innerWidth, setZoomState],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const target = e.target;
      const isStage = target === stage;
      const isNonListening = !target.listening();

      if (!isStage && !isNonListening) {
        return;
      }

      isDragging.current = true;
      lastPointerPos.current = stage.getPointerPosition();
    },
    [stageRef],
  );

  const handleMouseMove = useCallback(() => {
    if (!isDragging.current) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pos = stage.getPointerPosition();
    if (!pos || !lastPointerPos.current) {
      return;
    }

    const dx = pos.x - lastPointerPos.current.x;
    lastPointerPos.current = pos;
    updatePan(dx);
  }, [stageRef, updatePan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastPointerPos.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 1) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const target = e.target;
      const isStage = target === stage;
      const isNonListening = !target.listening();

      if (!isStage && !isNonListening) {
        return;
      }

      isDragging.current = true;
      lastPointerPos.current = stage.getPointerPosition();
    },
    [stageRef],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (!isDragging.current) {
        return;
      }

      if (e.evt.touches.length !== 1) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const pos = stage.getPointerPosition();
      if (!pos || !lastPointerPos.current) {
        return;
      }

      const dx = pos.x - lastPointerPos.current.x;
      lastPointerPos.current = pos;
      updatePan(dx);
    },
    [stageRef, updatePan],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastPointerPos.current = null;
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
