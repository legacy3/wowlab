export interface TicksParams {
  bounds: { min: number; max: number };
  tickCount: number;
}

export interface VisibleTicksParams extends TicksParams {
  visibleRange: { start: number; end: number };
}

export function generateTicks({ bounds, tickCount }: TicksParams): number[] {
  const range = bounds.max - bounds.min;
  const step = range / tickCount;

  return Array.from({ length: tickCount + 1 }, (_, i) => bounds.min + i * step);
}

export function filterVisibleTicks(
  ticks: number[],
  { bounds, tickCount, visibleRange }: VisibleTicksParams,
): number[] {
  const padding = (bounds.max - bounds.min) / tickCount;

  return ticks.filter(
    (tick) =>
      tick >= visibleRange.start - padding &&
      tick <= visibleRange.end + padding,
  );
}
