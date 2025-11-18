"use client";

import { useState, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WowItemTooltip } from "./wow-item-tooltip";
import { QUALITY_COLORS } from "@/lib/game/item-quality";

interface WowItemLinkProps {
  itemId: number;
  quality: number;
  children: React.ReactNode;
}

export function WowItemLink({ itemId, quality, children }: WowItemLinkProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen && !hasOpened) {
        setHasOpened(true);
      }
    },
    [hasOpened],
  );

  const qualityColor = QUALITY_COLORS[quality];
  const wowheadUrl = `https://www.wowhead.com/item=${itemId}`;

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={200}>
        <TooltipTrigger asChild>
          <a href={wowheadUrl} target="_blank" rel="noopener noreferrer">
            <span
              className="group/item inline-flex items-center gap-1.5 transition-colors hover:underline"
              style={{ color: qualityColor }}
            >
              {children}
              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/item:opacity-50" />
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm border-2 bg-popover p-3"
          style={{ borderColor: qualityColor }}
        >
          {hasOpened ? <WowItemTooltip itemId={itemId} /> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
