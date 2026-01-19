"use client";

import { useRef, useState } from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import type { TalentTreeData, TooltipData } from "./types";

import { TalentCanvas } from "./canvas/talent-canvas";
import { useCanvasResize } from "./canvas/use-canvas-resize";
import { TalentTooltip } from "./tooltip/talent-tooltip";

const containerStyles = css({
  "&:active": {
    cursor: "grabbing",
  },
  cursor: "grab",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  width: "100%",
});

export interface TalentTreeProps {
  className?: string;
  data: TalentTreeData | null;
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  selectedHeroId?: number | null;
}

/**
 * Main talent tree component that orchestrates canvas and tooltip.
 */
export function TalentTree({
  className,
  data,
  onNodeClick,
  selectedHeroId,
}: TalentTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useCanvasResize(containerRef);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  return (
    <Box ref={containerRef} className={`${containerStyles} ${className ?? ""}`}>
      <TalentCanvas
        data={data}
        dimensions={dimensions}
        onNodeClick={onNodeClick}
        onNodeHover={setTooltip}
        selectedHeroId={selectedHeroId}
      />

      {tooltip && <TalentTooltip data={tooltip} />}
    </Box>
  );
}
