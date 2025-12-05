import { useEffect, useRef, useCallback } from "react";
import {
  select,
  zoom,
  zoomIdentity,
  scaleLinear,
  type D3ZoomEvent,
  type ZoomBehavior,
  type ScaleLinear,
} from "d3";

interface UseTimelineZoomParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  innerWidth: number;
  totalHeight: number;
  totalDuration: number;
  initialWindow?: number;
  baseScale?: ScaleLinear<number, number>;
  onZoom: (transform: { k: number; x: number }) => void;
  onScaleChange?: (newScale: ScaleLinear<number, number>) => void;
}

interface UseTimelineZoomReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitAll: () => void;
  zoomToRange: (start: number, end: number) => void;
}

/**
 * Custom hook for D3 zoom behavior with proper rescaleX support.
 * Uses zoom.rescaleX() for efficient axis updates during zoom operations.
 */
export function useTimelineZoom({
  svgRef,
  innerWidth,
  totalHeight,
  totalDuration,
  initialWindow = 60,
  baseScale,
  onZoom,
  onScaleChange,
}: UseTimelineZoomParams): UseTimelineZoomReturn {
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );
  const initializedRef = useRef(false);

  // Calculate initial scale factor (how much to zoom in to show initialWindow)
  const initialScale = Math.max(1, totalDuration / initialWindow);

  // Set up zoom behavior with proper cleanup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || innerWidth <= 0 || totalHeight <= 0) return;

    // Create a reference scale if one isn't provided
    const xScale =
      baseScale ??
      scaleLinear().domain([0, totalDuration]).range([0, innerWidth]);

    // The full data width at current zoom level
    // translateExtent needs to account for the zoomed width
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 50]) // Allow zooming from fit-all (1x) to 50x
      .translateExtent([
        [0, 0],
        [innerWidth * initialScale, totalHeight], // Allow panning across full zoomed width
      ])
      .extent([
        [0, 0],
        [innerWidth, totalHeight],
      ])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const transform = event.transform;
        onZoom({ k: transform.k, x: transform.x });

        // Use rescaleX for efficient scale transformation
        if (onScaleChange && baseScale) {
          const newScale = transform.rescaleX(xScale);
          onScaleChange(newScale as ScaleLinear<number, number>);
        }
      });

    const selection = select(svg);
    selection.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Set initial zoom level to show initialWindow seconds
    if (!initializedRef.current && initialScale > 1) {
      const initialTransform = zoomIdentity.scale(initialScale);
      selection.call(zoomBehavior.transform, initialTransform);
      initializedRef.current = true;
    }

    // Cleanup: remove zoom listeners
    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [
    svgRef,
    innerWidth,
    totalHeight,
    totalDuration,
    initialScale,
    baseScale,
    onZoom,
    onScaleChange,
  ]);

  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    select(svg).transition().duration(200).call(zoomBehavior.scaleBy, 2);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    select(svg).transition().duration(200).call(zoomBehavior.scaleBy, 0.5);
  }, [svgRef]);

  // Reset to initial view (showing initialWindow at the start)
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    const initialTransform = zoomIdentity.scale(initialScale);
    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehavior.transform, initialTransform);
  }, [svgRef, initialScale]);

  // Fit all data in view (zoom out to see everything)
  const fitAll = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehavior.transform, zoomIdentity);
  }, [svgRef]);

  // Zoom to show a specific time range
  const zoomToRange = useCallback(
    (start: number, end: number) => {
      const svg = svgRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!svg || !zoomBehavior || innerWidth <= 0) return;

      // Calculate the scale factor needed to show this range
      const rangeSize = end - start;
      const k = totalDuration / rangeSize;

      // Calculate the x translation to position the start at the left edge
      // The base scale maps [0, totalDuration] to [0, innerWidth]
      // After zoom, we need to translate so that 'start' is at x=0
      const tx = -(start / totalDuration) * innerWidth * k;

      const newTransform = zoomIdentity.scale(k).translate(tx / k, 0);

      select(svg).call(zoomBehavior.transform, newTransform);
    },
    [svgRef, innerWidth, totalDuration],
  );

  return { zoomIn, zoomOut, resetZoom, fitAll, zoomToRange };
}
