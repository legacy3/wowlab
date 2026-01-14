"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";
import Konva from "konva";

interface UseFpsCounterParams {
  enabled: boolean;
  layerRef: RefObject<Konva.Text | null>;
}

let currentFps = 0;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);

  return () => listeners.delete(callback);
}

function getSnapshot() {
  return currentFps;
}

function setFpsValue(value: number) {
  if (currentFps !== value) {
    currentFps = value;
    listeners.forEach((listener) => listener());
  }
}

export function useFpsCounter({
  enabled,
  layerRef,
}: UseFpsCounterParams): number {
  const fps = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) {
      setFpsValue(0);
      return;
    }

    const layer = layerRef.current?.getLayer();
    if (!layer) {
      return;
    }

    const fpsHistory: number[] = [];
    const maxSamples = 30;

    const anim = new Konva.Animation((frame) => {
      if (!frame) {
        return;
      }

      fpsHistory.push(frame.frameRate);
      if (fpsHistory.length > maxSamples) {
        fpsHistory.shift();
      }

      const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      setFpsValue(Math.round(avgFps));
    }, layer);

    anim.start();

    return () => {
      anim.stop();
    };
  }, [enabled, layerRef]);

  return fps;
}
