"use client";

import type { ReactNode } from "react";
import { User } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCompact } from "@/lib/format";

import {
  CharacterSummaryCard,
  type CharacterProfession,
  type CharacterSummary,
} from "./character-summary-card";
import { EquipmentColumn } from "./equipment-column";
import { EquipmentSlotCard } from "./equipment-slot-card";
import {
  EQUIPMENT_LEFT_COLUMN,
  EQUIPMENT_RIGHT_COLUMN,
  EQUIPMENT_TRINKET_SLOTS,
  EQUIPMENT_WEAPON_SLOTS,
  type EquipmentSlot,
} from "./slots";

export type CharacterStats = {
  primaryStat: number;
  stamina: number;
  criticalStrike: number;
  haste: number;
  mastery: number;
  versatility: number;
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <Progress value={(value / 50) * 100} className="h-1" />
    </div>
  );
}

function StatsPopover({ stats }: { stats: CharacterStats }) {
  return (
    <div className="space-y-3 w-56">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Primary</span>
          <span className="font-medium tabular-nums">
            {formatCompact(stats.primaryStat)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stamina</span>
          <span className="font-medium tabular-nums">
            {formatCompact(stats.stamina)}
          </span>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <StatBar label="Critical Strike" value={stats.criticalStrike} />
        <StatBar label="Haste" value={stats.haste} />
        <StatBar label="Mastery" value={stats.mastery} />
        <StatBar label="Versatility" value={stats.versatility} />
      </div>
    </div>
  );
}

type CharacterEquipmentPanelProps = {
  character: CharacterSummary;
  gear: Record<EquipmentSlot, number | null>;
  stats: CharacterStats;
  professions?: ReadonlyArray<CharacterProfession>;
  rightContent?: ReactNode;
  onClear?: () => void;
  children?: ReactNode;
};

export function CharacterEquipmentPanel({
  character,
  gear,
  stats,
  professions,
  rightContent,
  onClear,
  children,
}: CharacterEquipmentPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CharacterSummaryCard
          character={character}
          professions={professions}
          rightContent={rightContent}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipment Grid */}
        <div className="grid grid-cols-3 gap-3">
          <EquipmentColumn
            gear={gear}
            position="left"
            slots={EQUIPMENT_LEFT_COLUMN}
          />

          {/* Center avatar with stats on hover */}
          <div className="flex items-center justify-center">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="h-28 w-28 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <div className="text-center text-muted-foreground">
                    <User className="mx-auto mb-1 h-7 w-7" />
                    <p className="text-[11px] font-semibold">
                      {character.name}
                    </p>
                    <p className="text-[9px]">
                      {character.race} {character.class}
                    </p>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="center">
                <StatsPopover stats={stats} />
              </HoverCardContent>
            </HoverCard>
          </div>

          <EquipmentColumn
            gear={gear}
            position="right"
            slots={EQUIPMENT_RIGHT_COLUMN}
          />
        </div>

        <Separator />

        {/* Trinkets */}
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_TRINKET_SLOTS.map((slot, index) => (
            <EquipmentSlotCard
              key={slot}
              slot={slot}
              itemId={gear[slot]}
              position={index === 0 ? "left" : "right"}
            />
          ))}
        </div>

        <Separator />

        {/* Weapons */}
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_WEAPON_SLOTS.map((slot, index) => (
            <EquipmentSlotCard
              key={slot}
              slot={slot}
              itemId={gear[slot]}
              position={index === 0 ? "left" : "right"}
            />
          ))}
        </div>

        {/* Optional children content */}
        {children}

        {/* Clear button */}
        {onClear && (
          <div className="mt-4 text-center">
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Import different character
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
