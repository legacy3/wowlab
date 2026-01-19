import { type RefObject, useEffect, useState } from "react";

export interface Dimensions {
  height: number;
  width: number;
}

/**
 * Track the dimensions of a container element using ResizeObserver.
 */
export function useCanvasResize(
  containerRef: RefObject<HTMLDivElement | null>,
  defaultDimensions: Dimensions = { height: 600, width: 800 },
): Dimensions {
  const [dimensions, setDimensions] = useState(defaultDimensions);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        height: Math.floor(rect.height),
        width: Math.floor(rect.width),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  return dimensions;
}
