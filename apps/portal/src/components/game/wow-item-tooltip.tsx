"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { itemAtomFamily } from "@/atoms/item-data";
// import { GameIcon } from "./game-icon"; // Temporarily disabled
import { Skeleton } from "@/components/ui/skeleton";
import { QUALITY_COLORS } from "@/lib/game/item-quality";

interface WowItemTooltipProps {
  itemId: number;
}

function WowItemTooltipInner({ itemId }: WowItemTooltipProps) {
  const [item] = useAtom(itemAtomFamily(itemId));
  const qualityColor = QUALITY_COLORS[item.quality] || QUALITY_COLORS[0];

  return (
    <div
      className="space-y-2.5 font-sans"
      style={{ borderColor: qualityColor }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Temporarily disabled - iconName not in data */}
        {/* <GameIcon iconName={item.iconName} size="large" alt={item.name} /> */}
        <div className="flex flex-1 flex-col gap-1">
          <span
            className="text-base font-semibold"
            style={{ color: qualityColor }}
          >
            {item.name}
          </span>
          <div className="text-xs text-muted-foreground">
            Quality {item.quality}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div className="border-t border-border pt-2 text-sm leading-relaxed italic text-amber-600 dark:text-amber-400">
          {item.description}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
        <span className="text-muted-foreground">
          Item Level {item.itemLevel}
        </span>
      </div>
    </div>
  );
}

function WowItemTooltipSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function WowItemTooltip({ itemId }: WowItemTooltipProps) {
  return (
    <Suspense fallback={<WowItemTooltipSkeleton />}>
      <WowItemTooltipInner itemId={itemId} />
    </Suspense>
  );
}
