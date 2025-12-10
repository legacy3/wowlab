"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
import { GameIcon } from "./game-icon";

// WoW Item Quality Colors
const QUALITY_COLORS = {
  0: "#9d9d9d", // Poor (Gray)
  1: "#ffffff", // Common (White)
  2: "#1eff00", // Uncommon (Green)
  3: "#0070dd", // Rare (Blue)
  4: "#a335ee", // Epic (Purple)
  5: "#ff8000", // Legendary (Orange)
  6: "#e6cc80", // Artifact (Light Gold)
  7: "#00ccff", // Heirloom (Cyan)
} as const;

const QUALITY_NAMES = {
  0: "Poor",
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
  6: "Artifact",
  7: "Heirloom",
} as const;

// School colors for spell damage types
const SCHOOL_COLORS = {
  physical: "#ffff00",
  holy: "#ffff99",
  fire: "#ff4500",
  nature: "#4dff4d",
  frost: "#80dfff",
  shadow: "#9933ff",
  arcane: "#ff80ff",
} as const;

export type ItemQuality = keyof typeof QUALITY_COLORS;
export type SpellSchool = keyof typeof SCHOOL_COLORS;

// Mock item data structure
export interface ItemTooltipData {
  name: string;
  quality: ItemQuality;
  itemLevel: number;
  binding?: "BoP" | "BoE" | "BoU";
  slot?: string;
  armorType?: string;
  armor?: number;
  stats?: Array<{ name: string; value: number }>;
  secondaryStats?: Array<{ name: string; value: number }>;
  effects?: Array<{ text: string; isEquip?: boolean; isUse?: boolean }>;
  setName?: string;
  setPieces?: Array<{ name: string; collected: boolean }>;
  setBonuses?: Array<{ required: number; text: string; active: boolean }>;
  requiredLevel?: number;
  sellPrice?: { gold: number; silver: number; copper: number };
  iconName?: string;
}

// Mock spell data structure
export interface SpellTooltipData {
  name: string;
  rank?: string;
  castTime: string;
  cooldown?: string;
  range?: string;
  cost?: string;
  school?: SpellSchool;
  description: string;
  iconName?: string;
}

// Tooltip wrapper component
function GameTooltipRoot({
  children,
  openDelay = 200,
  closeDelay = 100,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root> & {
  openDelay?: number;
  closeDelay?: number;
}) {
  return (
    <HoverCardPrimitive.Root
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    >
      {children}
    </HoverCardPrimitive.Root>
  );
}

function GameTooltipTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger asChild {...props} />;
}

function GameTooltipContent({
  className,
  align = "start",
  side = "right",
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          // Base styling - WoW-inspired dark tooltip
          "z-50 w-72 rounded border border-[#3a3a3a] bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] p-3 shadow-xl",
          // Inner glow/border effect
          "ring-1 ring-inset ring-white/5",
          // Animation
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
          "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className,
        )}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );
}

// Item Tooltip Content Component
export function ItemTooltipContent({ item }: { item: ItemTooltipData }) {
  const qualityColor = QUALITY_COLORS[item.quality];

  return (
    <div className="flex flex-col gap-1 text-sm">
      {/* Header with icon and name */}
      <div className="flex items-start gap-2">
        {item.iconName && (
          <div className="shrink-0 overflow-hidden rounded border border-[#3a3a3a]">
            <GameIcon iconName={item.iconName} size="large" />
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span
            className="font-semibold leading-tight"
            style={{ color: qualityColor }}
          >
            {item.name}
          </span>
          <span className="text-xs text-[#ffd100]">
            Item Level {item.itemLevel}
          </span>
        </div>
      </div>

      {/* Binding */}
      {item.binding && (
        <span className="text-xs text-white/70">
          {item.binding === "BoP" && "Binds when picked up"}
          {item.binding === "BoE" && "Binds when equipped"}
          {item.binding === "BoU" && "Binds when used"}
        </span>
      )}

      {/* Slot and Armor Type */}
      {(item.slot || item.armorType) && (
        <div className="flex justify-between text-xs text-white/90">
          {item.slot && <span>{item.slot}</span>}
          {item.armorType && <span>{item.armorType}</span>}
        </div>
      )}

      {/* Armor */}
      {item.armor !== undefined && (
        <span className="text-xs text-white/90">{item.armor} Armor</span>
      )}

      {/* Primary Stats */}
      {item.stats && item.stats.length > 0 && (
        <div className="flex flex-col text-xs text-white/90">
          {item.stats.map((stat, i) => (
            <span key={i}>
              +{stat.value} {stat.name}
            </span>
          ))}
        </div>
      )}

      {/* Secondary Stats (green) */}
      {item.secondaryStats && item.secondaryStats.length > 0 && (
        <div className="flex flex-col text-xs text-[#1eff00]">
          {item.secondaryStats.map((stat, i) => (
            <span key={i}>
              +{stat.value} {stat.name}
            </span>
          ))}
        </div>
      )}

      {/* Effects */}
      {item.effects && item.effects.length > 0 && (
        <div className="flex flex-col gap-0.5 text-xs text-[#1eff00]">
          {item.effects.map((effect, i) => (
            <span key={i}>
              {effect.isEquip && (
                <span className="text-[#1eff00]">Equip: </span>
              )}
              {effect.isUse && <span className="text-[#1eff00]">Use: </span>}
              {effect.text}
            </span>
          ))}
        </div>
      )}

      {/* Set Bonus */}
      {item.setName && (
        <div className="mt-1 flex flex-col gap-0.5 border-t border-white/10 pt-1">
          <span className="text-xs text-[#ffd100]">{item.setName}</span>
          {item.setPieces?.map((piece, i) => (
            <span
              key={i}
              className={cn(
                "text-xs",
                piece.collected ? "text-[#ffd100]" : "text-[#666666]",
              )}
            >
              {piece.name}
            </span>
          ))}
          {item.setBonuses?.map((bonus, i) => (
            <span
              key={i}
              className={cn(
                "text-xs",
                bonus.active ? "text-[#1eff00]" : "text-[#666666]",
              )}
            >
              ({bonus.required}) Set: {bonus.text}
            </span>
          ))}
        </div>
      )}

      {/* Required Level */}
      {item.requiredLevel && (
        <span className="text-xs text-white/70">
          Requires Level {item.requiredLevel}
        </span>
      )}

      {/* Sell Price */}
      {item.sellPrice && (
        <div className="mt-1 flex items-center gap-1 border-t border-white/10 pt-1 text-xs">
          <span className="text-white/70">Sell Price:</span>
          {item.sellPrice.gold > 0 && (
            <span className="text-[#ffd700]">{item.sellPrice.gold}g</span>
          )}
          {item.sellPrice.silver > 0 && (
            <span className="text-[#c0c0c0]">{item.sellPrice.silver}s</span>
          )}
          {item.sellPrice.copper > 0 && (
            <span className="text-[#b87333]">{item.sellPrice.copper}c</span>
          )}
        </div>
      )}
    </div>
  );
}

// Spell Tooltip Content Component
export function SpellTooltipContent({ spell }: { spell: SpellTooltipData }) {
  const schoolColor = spell.school ? SCHOOL_COLORS[spell.school] : "#ffffff";

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {/* Header with icon and name */}
      <div className="flex items-start gap-2">
        {spell.iconName && (
          <div className="shrink-0 overflow-hidden rounded border border-[#3a3a3a]">
            <GameIcon iconName={spell.iconName} size="large" />
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold leading-tight text-white">
            {spell.name}
          </span>
          {spell.rank && (
            <span className="text-xs text-white/60">{spell.rank}</span>
          )}
        </div>
      </div>

      {/* Cast info row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/90">
        {spell.cost && <span style={{ color: "#3399ff" }}>{spell.cost}</span>}
        <span>{spell.castTime}</span>
        {spell.range && <span>{spell.range}</span>}
      </div>

      {/* Cooldown */}
      {spell.cooldown && (
        <span className="text-xs text-white/90">{spell.cooldown} cooldown</span>
      )}

      {/* Description */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: spell.school ? schoolColor : "#ffd100" }}
      >
        {spell.description}
      </p>
    </div>
  );
}

// Composed Item Tooltip
export function ItemTooltip({
  item,
  children,
}: {
  item: ItemTooltipData;
  children: React.ReactNode;
}) {
  return (
    <GameTooltipRoot>
      <GameTooltipTrigger>{children}</GameTooltipTrigger>
      <GameTooltipContent>
        <ItemTooltipContent item={item} />
      </GameTooltipContent>
    </GameTooltipRoot>
  );
}

// Composed Spell Tooltip
export function SpellTooltip({
  spell,
  children,
}: {
  spell: SpellTooltipData;
  children: React.ReactNode;
}) {
  return (
    <GameTooltipRoot>
      <GameTooltipTrigger>{children}</GameTooltipTrigger>
      <GameTooltipContent>
        <SpellTooltipContent spell={spell} />
      </GameTooltipContent>
    </GameTooltipRoot>
  );
}

// Export primitives for custom composition
export {
  GameTooltipRoot,
  GameTooltipTrigger,
  GameTooltipContent,
  QUALITY_COLORS,
  QUALITY_NAMES,
  SCHOOL_COLORS,
};
