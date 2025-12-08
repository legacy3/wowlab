import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WowItemLink, GameIcon } from "@/components/game";
import { cn } from "@/lib/utils";
import { formatGearSlotName } from "@/lib/format-gear-slot";

import type { EquipmentSlot } from "./slots";

export type EquipmentSlotItem = Readonly<{
  id: number;
  ilvl: number;
  isUpgrade?: boolean;
  name: string;
  quality?: number;
  iconName?: string;
}>;

export type AlternativeItem = Readonly<{
  id: number;
  ilvl: number;
  name: string;
  dpsChange: number;
  dpsChangePercent: number;
  quality?: number;
  iconName?: string;
}>;

type EquipmentSlotCardProps = {
  alternatives?: ReadonlyArray<AlternativeItem>;
  className?: string;
  emptyIcon?: ReactNode;
  emptyLabel?: string;
  item: EquipmentSlotItem | null;
  position?: "left" | "right";
  showUpgradeBadge?: boolean;
  slot: EquipmentSlot;
};

export function EquipmentSlotCard({
  alternatives = [],
  className,
  emptyIcon,
  emptyLabel = "Empty",
  item,
  position = "left",
  showUpgradeBadge = false,
  slot,
}: EquipmentSlotCardProps) {
  const isRightAligned = position === "right";
  const slotName = formatGearSlotName(slot);
  const hasAlternatives = alternatives.length > 0;

  const icon = item ? (
    <div
      className={cn(
        "relative h-10 w-10 shrink-0 rounded border",
        item.isUpgrade ? "border-green-500" : "border-border",
      )}
    >
      <GameIcon
        iconName={item.iconName ?? "inv_misc_questionmark"}
        size="medium"
        alt={item.name}
      />
      {item.isUpgrade && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-background bg-green-500" />
      )}
    </div>
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 bg-muted/10">
      {emptyIcon ?? <span className="text-xs text-muted-foreground">—</span>}
    </div>
  );

  const upgradeBadge = showUpgradeBadge && item?.isUpgrade && (
    <Badge
      variant="outline"
      className="text-[11px] leading-none text-green-500"
    >
      Upgrade
    </Badge>
  );

  const itemInfo = item && (
    <span>
      {isRightAligned
        ? `${slotName} · iLvl ${item.ilvl}`
        : `iLvl ${item.ilvl} · ${slotName}`}
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
            {isRightAligned && upgradeBadge}
            {itemInfo}
            {!isRightAligned && upgradeBadge}
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

  const cardContent = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-2 transition-colors",
        hasAlternatives && "cursor-pointer hover:bg-muted/50",
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

  if (!hasAlternatives) {
    return cardContent;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <div className="space-y-2 max-w-sm">
            <p className="text-xs font-semibold mb-2">Alternative Items</p>
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 shrink-0">
                    <GameIcon
                      iconName={alt.iconName ?? "inv_misc_questionmark"}
                      size="small"
                      alt={alt.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">
                      <WowItemLink itemId={alt.id} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      iLvl {alt.ilvl}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-medium shrink-0 text-xs",
                    alt.dpsChange >= 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {alt.dpsChange >= 0 ? "+" : ""}
                  {alt.dpsChange} ({alt.dpsChangePercent >= 0 ? "+" : ""}
                  {alt.dpsChangePercent.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
