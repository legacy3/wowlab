"use client";

import { useVirtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export interface UseVirtualListOptions {
  count: number;
  estimateSize: number | ((index: number) => number);
  horizontal?: boolean;
  overscan?: number;
}

export interface UseVirtualListResult {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
}

export interface UseWindowVirtualListOptions {
  count: number;
  estimateSize: number | ((index: number) => number);
  overscan?: number;
}

export interface UseWindowVirtualListResult {
  virtualizer: ReturnType<typeof useWindowVirtualizer>;
}

export function useVirtualList({
  count,
  estimateSize,
  horizontal = false,
  overscan = 5,
}: UseVirtualListOptions): UseVirtualListResult {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count,
    estimateSize:
      typeof estimateSize === "function" ? estimateSize : () => estimateSize,
    getScrollElement: () => parentRef.current,
    horizontal,
    overscan,
  });

  return { parentRef, virtualizer };
}

export function useWindowVirtualList({
  count,
  estimateSize,
  overscan = 5,
}: UseWindowVirtualListOptions): UseWindowVirtualListResult {
  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize:
      typeof estimateSize === "function" ? estimateSize : () => estimateSize,
    overscan,
  });

  return { virtualizer };
}
