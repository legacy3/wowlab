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
  baseScale?: ScaleLinear<number, number>;
  onZoom: (transform: { k: number; x: number }) => void;
  onScaleChange?: (newScale: ScaleLinear<number, number>) => void;
}

interface UseTimelineZoomReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

/**
 * Custom hook for D3 zoom behavior with proper rescaleX support.
 * Uses zoom.rescaleX() for efficient axis updates during zoom operations.
 */
export function useTimelineZoom({
  svgRef,
  innerWidth,
  totalHeight,
  baseScale,
  onZoom,
  onScaleChange,
}: UseTimelineZoomParams): UseTimelineZoomReturn {
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  // Set up zoom behavior with proper cleanup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || innerWidth <= 0 || totalHeight <= 0) return;

    // Create a reference scale if one isn't provided
    const xScale =
      baseScale ?? scaleLinear().domain([0, 60]).range([0, innerWidth]);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 30])
      .translateExtent([
        [0, 0],
        [innerWidth, totalHeight],
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

    // Cleanup: remove zoom listeners
    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [svgRef, innerWidth, totalHeight, baseScale, onZoom, onScaleChange]);

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

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;

    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehavior.transform, zoomIdentity);
  }, [svgRef]);

  return { zoomIn, zoomOut, resetZoom };
}
