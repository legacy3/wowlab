"use client";

import type { ReactNode } from "react";

import { WowItemLink, GameIcon } from "@/components/game";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatGearSlotName } from "@/lib/format-gear-slot";
import { useItem } from "@/hooks/use-item";

import type { EquipmentSlot } from "./slots";

type EquipmentSlotCardProps = {
  className?: string;
  emptyIcon?: ReactNode;
  emptyLabel?: string;
  itemId: number | null;
  position?: "left" | "right";
  slot: EquipmentSlot;
};

export function EquipmentSlotCard({
  className,
  emptyIcon,
  emptyLabel = "Empty",
  itemId,
  position = "left",
  slot,
}: EquipmentSlotCardProps) {
  const { data: item, isLoading } = useItem(itemId);
  const isRightAligned = position === "right";
  const slotName = formatGearSlotName(slot);

  if (isLoading && itemId) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-card p-2",
          className,
        )}
      >
        {isRightAligned ? (
          <>
            <div className="min-w-0 flex-1 text-right">
              <Skeleton className="ml-auto h-4 w-24" />
              <Skeleton className="ml-auto mt-1 h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded" />
          </>
        ) : (
          <>
            <Skeleton className="h-10 w-10 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          </>
        )}
      </div>
    );
  }

  const icon = item ? (
    <div className="relative h-10 w-10 shrink-0 rounded border border-border">
      <GameIcon
        iconName={item.fileName ?? "inv_misc_questionmark"}
        size="medium"
        alt={item.name}
      />
    </div>
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 bg-muted/10">
      {emptyIcon ?? <span className="text-xs text-muted-foreground">—</span>}
    </div>
  );

  const itemInfo = item && (
    <span>
      {isRightAligned
        ? `${slotName} · iLvl ${item.itemLevel}`
        : `iLvl ${item.itemLevel} · ${slotName}`}
    </span>
  );

  const content = (
    <div className={cn("min-w-0 flex-1", isRightAligned && "text-right")}>
      {item ? (
        <div>
          <p className="truncate text-sm font-medium">
            <WowItemLink itemId={item.id} />
          </p>
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
              isRightAligned && "justify-end",
            )}
          >
            {itemInfo}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm italic text-muted-foreground">{emptyLabel}</p>
          <p className="text-xs text-muted-foreground">{slotName}</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-2 transition-colors",
        className,
      )}
    >
      {isRightAligned ? (
        <>
          {content}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {content}
        </>
      )}
    </div>
  );
}
