"use client";

import { memo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SpellReference } from "./types";

// Mock spell data - in production this would come from a hook/API
const MOCK_SPELLS: SpellReference[] = [
  { id: 56641, name: "Steady Shot", icon: "ability_hunter_steadyshot", color: "#4ade80" },
  { id: 34026, name: "Kill Command", icon: "ability_hunter_killcommand", color: "#f97316" },
  { id: 193455, name: "Cobra Shot", icon: "ability_hunter_cobrashot", color: "#22d3ee" },
  { id: 19434, name: "Aimed Shot", icon: "ability_hunter_aimedshot", color: "#a855f7" },
  { id: 257620, name: "Multi-Shot", icon: "ability_upgrademoonglaive", color: "#eab308" },
  { id: 186270, name: "Raptor Strike", icon: "ability_hunter_raptorstrike", color: "#ef4444" },
  { id: 781, name: "Disengage", icon: "ability_hunter_displacement", color: "#3b82f6" },
  { id: 109248, name: "Binding Shot", icon: "ability_hunter_bindingshot", color: "#8b5cf6" },
  { id: 5384, name: "Feign Death", icon: "ability_rogue_feigndeath", color: "#6b7280" },
  { id: 187650, name: "Freezing Trap", icon: "spell_frost_chainsofice", color: "#60a5fa" },
];

/** Spell category for grouping */
type SpellCategory = "damage" | "utility" | "defensive" | "cooldown";

const SPELL_CATEGORIES: Record<number, SpellCategory> = {
  56641: "damage",
  34026: "damage",
  193455: "damage",
  19434: "damage",
  257620: "damage",
  186270: "damage",
  781: "utility",
  109248: "utility",
  5384: "defensive",
  187650: "utility",
};

interface SpellPickerProps {
  value?: number;
  onChange: (spellId: number) => void;
  spells?: SpellReference[];
  className?: string;
}

/** Small spell icon */
function SpellIcon({
  spell,
  size = "default",
}: {
  spell: SpellReference;
  size?: "sm" | "default";
}) {
  const sizeClass = size === "sm" ? "size-5" : "size-8";

  return (
    <div
      className={cn(
        "rounded flex items-center justify-center text-white font-bold",
        sizeClass,
        size === "sm" ? "text-[8px]" : "text-xs"
      )}
      style={{ backgroundColor: spell.color || "#6366f1" }}
    >
      {spell.name.charAt(0)}
    </div>
  );
}

export const SpellPicker = memo(function SpellPicker({
  value,
  onChange,
  spells = MOCK_SPELLS,
  className,
}: SpellPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedSpell = spells.find((s) => s.id === value);

  const filteredSpells = spells.filter((spell) =>
    spell.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedSpells = filteredSpells.reduce(
    (acc, spell) => {
      const category = SPELL_CATEGORIES[spell.id] || "damage";
      if (!acc[category]) acc[category] = [];
      acc[category].push(spell);
      return acc;
    },
    {} as Record<SpellCategory, SpellReference[]>
  );

  const categoryLabels: Record<SpellCategory, string> = {
    damage: "Damage",
    utility: "Utility",
    defensive: "Defensive",
    cooldown: "Cooldowns",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start gap-2 h-9 font-normal",
            !selectedSpell && "text-muted-foreground",
            className
          )}
        >
          {selectedSpell ? (
            <>
              <SpellIcon spell={selectedSpell} size="sm" />
              <span className="truncate">{selectedSpell.name}</span>
            </>
          ) : (
            <>
              <Zap className="size-4" />
              Select spell...
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search spells..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>

        {/* Spell list */}
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {filteredSpells.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No spells found
              </div>
            ) : (
              Object.entries(groupedSpells).map(([category, categorySpells]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {categoryLabels[category as SpellCategory]}
                  </div>
                  {categorySpells.map((spell) => (
                    <button
                      key={spell.id}
                      className={cn(
                        "flex items-center gap-2 w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors",
                        value === spell.id && "bg-accent"
                      )}
                      onClick={() => {
                        onChange(spell.id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <SpellIcon spell={spell} size="sm" />
                      <span className="flex-1 truncate">{spell.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {spell.id}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer with count */}
        <div className="px-2 py-1.5 border-t text-[10px] text-muted-foreground">
          {filteredSpells.length} spells available
        </div>
      </PopoverContent>
    </Popover>
  );
});

/** Compact inline spell display */
export const SpellBadge = memo(function SpellBadge({
  spell,
  className,
}: {
  spell: SpellReference;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${spell.color}20`,
        color: spell.color,
      }}
    >
      <SpellIcon spell={spell} size="sm" />
      {spell.name}
    </div>
  );
});
