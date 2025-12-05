import { useEffect, useRef, useCallback } from "react";
import {
  select,
  zoom,
  zoomIdentity,
  type D3ZoomEvent,
  type ZoomBehavior,
} from "d3";

interface UseTimelineZoomParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  innerWidth: number;
  totalHeight: number;
  onZoom: (transform: { k: number; x: number }) => void;
}

interface UseTimelineZoomReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export function useTimelineZoom({
  svgRef,
  innerWidth,
  totalHeight,
  onZoom,
}: UseTimelineZoomParams): UseTimelineZoomReturn {
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  // Set up zoom behavior with proper cleanup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || innerWidth <= 0 || totalHeight <= 0) return;

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
        onZoom({ k: event.transform.k, x: event.transform.x });
      });

    const selection = select(svg);
    selection.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Cleanup: remove zoom listeners
    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [svgRef, innerWidth, totalHeight, onZoom]);

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
