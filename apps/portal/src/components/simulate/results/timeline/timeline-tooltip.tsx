"use client";

import type { TooltipState } from "./timeline-context";

interface TimelineTooltipProps {
  tooltip: TooltipState | null;
}

export function TimelineTooltip({ tooltip }: TimelineTooltipProps) {
  if (!tooltip) {
    return null;
  }

  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: tooltip.x,
        top: tooltip.y - 12,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-lg border bg-popover/95 backdrop-blur-sm px-3 py-2 text-sm shadow-lg">
        {tooltip.content}
      </div>
    </div>
  );
}
