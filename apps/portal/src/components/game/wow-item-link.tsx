"use client";

import { ExternalLink } from "lucide-react";
import { QUALITY_COLORS } from "@/lib/game/item-quality";

interface WowItemLinkProps {
  itemId: number;
  quality: number;
  children: React.ReactNode;
}

export function WowItemLink({ itemId, quality, children }: WowItemLinkProps) {
  const qualityColor = QUALITY_COLORS[quality];
  const wowheadUrl = `https://www.wowhead.com/item=${itemId}`;

  return (
    <a href={wowheadUrl} target="_blank" rel="noopener noreferrer">
      <span
        className="group/item inline-flex items-center gap-1.5 transition-colors hover:underline"
        style={{ color: qualityColor }}
      >
        {children}
        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/item:opacity-50" />
      </span>
    </a>
  );
}
