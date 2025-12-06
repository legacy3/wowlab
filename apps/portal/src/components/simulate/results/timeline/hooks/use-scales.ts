import { useMemo } from "react";
import type { TimelineBounds } from "@/atoms/timeline";
import type { ZoomState } from "./use-zoom";

interface UseScalesParams {
  bounds: TimelineBounds;
  innerWidth: number;
  damageTrackHeight: number;
  resourceTrackHeight: number;
  maxDamage: number;
  zoomState: ZoomState;
}

interface Scales {
  /** Convert time to x coordinate (accounting for zoom/pan) */
  timeToX: (time: number) => number;
  /** Convert x coordinate to time (accounting for zoom/pan) */
  xToTime: (x: number) => number;
  /** Convert damage amount to y coordinate within damage track */
  damageToY: (amount: number) => number;
  /** Convert focus value to y coordinate within resource track */
  focusToY: (focus: number) => number;
  /** Get visible time range based on current zoom */
  visibleRange: { start: number; end: number };
}

export function useScales({
  bounds,
  innerWidth,
  damageTrackHeight,
  resourceTrackHeight,
  maxDamage,
  zoomState,
}: UseScalesParams): Scales {
  const { scale, x: offsetX } = zoomState;

  // Base time-to-pixel ratio (unzoomed)
  const basePixelsPerSecond = useMemo(
    () => innerWidth / (bounds.max - bounds.min),
    [innerWidth, bounds.min, bounds.max],
  );

  // Convert time to x coordinate (with zoom transform)
  const timeToX = useMemo(() => {
    return (time: number): number => {
      const baseX = (time - bounds.min) * basePixelsPerSecond;
      return baseX * scale + offsetX;
    };
  }, [bounds.min, basePixelsPerSecond, scale, offsetX]);

  // Convert x coordinate to time (inverse transform)
  const xToTime = useMemo(() => {
    return (x: number): number => {
      const baseX = (x - offsetX) / scale;
      return baseX / basePixelsPerSecond + bounds.min;
    };
  }, [bounds.min, basePixelsPerSecond, scale, offsetX]);

  // Damage Y scale (inverted - higher values at top)
  const damageToY = useMemo(() => {
    const range = damageTrackHeight - 10; // 5px padding top and bottom
    return (amount: number): number => {
      const normalized = amount / maxDamage;
      return damageTrackHeight - 5 - normalized * range;
    };
  }, [damageTrackHeight, maxDamage]);

  // Focus Y scale (inverted - higher values at top)
  const focusToY = useMemo(() => {
    const range = resourceTrackHeight - 10; // 5px padding top and bottom
    const maxFocus = 120;
    return (focus: number): number => {
      const normalized = focus / maxFocus;
      return resourceTrackHeight - 5 - normalized * range;
    };
  }, [resourceTrackHeight]);

  // Calculate visible time range
  const visibleRange = useMemo(() => {
    return {
      start: xToTime(0),
      end: xToTime(innerWidth),
    };
  }, [xToTime, innerWidth]);

  return {
    timeToX,
    xToTime,
    damageToY,
    focusToY,
    visibleRange,
  };
}
