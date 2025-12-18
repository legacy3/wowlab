"use client";

import { memo } from "react";
import { Zap, Heart } from "lucide-react";
import { GameIcon } from "@/components/game";
import type { PlaybackFrame, SpellInfo } from "./mock-data";
import { MOCK_SPELLS } from "./mock-data";

interface StatePanelProps {
  frame: PlaybackFrame | null;
}

function ResourceBar({
  label,
  icon: Icon,
  current,
  max,
  color,
}: {
  label: string;
  icon: React.ElementType;
  current: number;
  max: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-mono tabular-nums text-foreground">
          {Math.round(current)}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{ width: `${(current / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CooldownItem({
  spell,
  remaining,
}: {
  spell: SpellInfo;
  remaining: number;
}) {
  const isReady = remaining <= 0;

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <GameIcon
        iconName={spell.icon}
        size="small"
        className="w-5 h-5 shrink-0"
      />
      <span className="text-xs truncate flex-1 text-muted-foreground">
        {spell.name}
      </span>
      <span
        className={`text-xs font-mono tabular-nums font-medium ${isReady ? "text-green-500" : "text-muted-foreground"}`}
      >
        {isReady ? "Ready" : `${remaining.toFixed(1)}s`}
      </span>
    </div>
  );
}

export const StatePanel = memo(function StatePanel({ frame }: StatePanelProps) {
  if (!frame) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground text-center">
        Press play to start
      </div>
    );
  }

  const { state } = frame;
  const spellsWithCooldowns = MOCK_SPELLS.filter((s) => s.cooldown > 0);
  const barbedShot = MOCK_SPELLS.find((s) => s.id === 217200);
  const barbedCharges = state.charges.get(217200) ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 text-sm">
      {/* Resources */}
      <div className="space-y-3">
        <ResourceBar
          label="Focus"
          icon={Zap}
          current={state.focus}
          max={state.maxFocus}
          color="#f59e0b"
        />
        <ResourceBar
          label="Target"
          icon={Heart}
          current={state.targetHealth}
          max={100}
          color="#ef4444"
        />
      </div>

      {/* Barbed Shot Charges */}
      {barbedShot && (
        <div className="flex items-center gap-2.5 py-2 border-t pt-4">
          <GameIcon
            iconName={barbedShot.icon}
            size="small"
            className="w-5 h-5"
          />
          <span className="text-xs flex-1 text-muted-foreground">
            {barbedShot.name}
          </span>
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < barbedCharges ? "bg-amber-500" : "bg-muted/60"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cooldowns */}
      <div className="border-t pt-4 space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Cooldowns
        </span>
        <div className="space-y-0">
          {spellsWithCooldowns.map((spell) => (
            <CooldownItem
              key={spell.id}
              spell={spell}
              remaining={state.cooldowns.get(spell.id) ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Current cast */}
      {frame.castSpellId && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-green-500/10 border border-green-500/20">
            <GameIcon
              iconName={
                MOCK_SPELLS.find((s) => s.id === frame.castSpellId)?.icon ??
                "inv_misc_questionmark"
              }
              size="small"
              className="w-6 h-6"
            />
            <span className="text-sm font-medium text-green-400">
              {MOCK_SPELLS.find((s) => s.id === frame.castSpellId)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
