import { useMemo } from "react";
import { scaleLinear, line, area, curveMonotoneX, type ScaleLinear } from "d3";
import type { TimelineBounds } from "@/atoms/timeline";

interface UseTimelineScalesParams {
  bounds: TimelineBounds;
  innerWidth: number;
  damageTrackHeight: number;
  resourceTrackHeight: number;
  maxDamage: number;
  transform?: { k: number; x: number } | null;
}

interface TimelineScales {
  x: ScaleLinear<number, number>;
  damageY: ScaleLinear<number, number>;
  resourceY: ScaleLinear<number, number>;
  focusArea: ReturnType<typeof area<{ timestamp: number; focus: number }>>;
  focusLine: ReturnType<typeof line<{ timestamp: number; focus: number }>>;
}

export function useTimelineScales({
  bounds,
  innerWidth,
  damageTrackHeight,
  resourceTrackHeight,
  maxDamage,
  transform,
}: UseTimelineScalesParams): TimelineScales {
  // Base X scale
  const xBase = useMemo(
    () => scaleLinear().domain([bounds.min, bounds.max]).range([0, innerWidth]),
    [bounds.min, bounds.max, innerWidth],
  );

  // Transformed X scale (accounts for zoom/pan)
  const x = useMemo(() => {
    if (!transform) return xBase;

    return xBase
      .copy()
      .domain([
        xBase.invert(-transform.x / transform.k),
        xBase.invert((innerWidth - transform.x) / transform.k),
      ]);
  }, [xBase, transform, innerWidth]);

  // Damage Y scale
  const damageY = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxDamage])
        .range([damageTrackHeight - 5, 5]),
    [maxDamage, damageTrackHeight],
  );

  // Resource Y scale
  const resourceY = useMemo(
    () =>
      scaleLinear()
        .domain([0, 120])
        .range([resourceTrackHeight - 5, 5]),
    [resourceTrackHeight],
  );

  // Focus area generator
  const focusArea = useMemo(
    () =>
      area<{ timestamp: number; focus: number }>()
        .x((d) => x(d.timestamp))
        .y0(resourceTrackHeight - 5)
        .y1((d) => resourceY(d.focus))
        .curve(curveMonotoneX),
    [x, resourceY, resourceTrackHeight],
  );

  // Focus line generator
  const focusLine = useMemo(
    () =>
      line<{ timestamp: number; focus: number }>()
        .x((d) => x(d.timestamp))
        .y((d) => resourceY(d.focus))
        .curve(curveMonotoneX),
    [x, resourceY],
  );

  return { x, damageY, resourceY, focusArea, focusLine };
}
