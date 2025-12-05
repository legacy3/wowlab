"use client";

import type { TooltipState } from "./timeline-context";

interface TimelineTooltipProps {
  tooltip: TooltipState | null;
}

export function TimelineTooltip({ tooltip }: TimelineTooltipProps) {
  if (!tooltip) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
        {tooltip.content}
      </div>
    </div>
  );
}
