"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Clock, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Spell {
  id: number;
  name: string;
  cooldown: number;
  gcd: boolean;
  description: string;
  school: string;
}

// Mock spell data - would come from your WoW MCP in real implementation
const MOCK_SPELLS: Spell[] = [
  {
    id: 217200,
    name: "Barbed Shot",
    cooldown: 12,
    gcd: true,
    description: "Fire a shot that poisons your target.",
    school: "Physical",
  },
  {
    id: 19574,
    name: "Bestial Wrath",
    cooldown: 90,
    gcd: false,
    description: "Sends you and your pet into a rage.",
    school: "Physical",
  },
  {
    id: 321530,
    name: "Bloodshed",
    cooldown: 60,
    gcd: true,
    description: "Command your pet to tear into your target.",
    school: "Physical",
  },
  {
    id: 359844,
    name: "Call of the Wild",
    cooldown: 180,
    gcd: false,
    description: "Summon all your pets to fight alongside you.",
    school: "Nature",
  },
  {
    id: 193455,
    name: "Cobra Shot",
    cooldown: 0,
    gcd: true,
    description: "A quick shot causing Nature damage.",
    school: "Nature",
  },
  {
    id: 212431,
    name: "Explosive Shot",
    cooldown: 30,
    gcd: true,
    description: "Fire an explosive shot at your target.",
    school: "Fire",
  },
  {
    id: 34026,
    name: "Kill Command",
    cooldown: 7.5,
    gcd: true,
    description: "Give the command to kill.",
    school: "Physical",
  },
  {
    id: 53351,
    name: "Kill Shot",
    cooldown: 10,
    gcd: true,
    description: "You attempt to finish off a wounded target.",
    school: "Physical",
  },
  {
    id: 2643,
    name: "Multi-Shot",
    cooldown: 0,
    gcd: true,
    description: "Fires several missiles at multiple targets.",
    school: "Physical",
  },
];

const toConstantCase = (name: string) =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_");

interface SpellBrowserProps {
  onInsert: (snippet: string) => void;
}

export function SpellBrowser({ onInsert }: SpellBrowserProps) {
  const [search, setSearch] = useState("");

  const filteredSpells = useMemo(() => {
    if (!search) return MOCK_SPELLS;
    const lower = search.toLowerCase();
    return MOCK_SPELLS.filter(
      (spell) =>
        spell.name.toLowerCase().includes(lower) ||
        spell.id.toString().includes(lower),
    );
  }, [search]);

  const handleInsertId = (spell: Spell) => {
    const constName = toConstantCase(spell.name);
    onInsert(`${constName}: ${spell.id},`);
  };

  const handleInsertCast = (spell: Spell) => {
    const constName = toConstantCase(spell.name);
    if (spell.gcd) {
      onInsert(`const ${spell.name.toLowerCase().replace(/\s+/g, "")} = yield* tryCast(rotation, playerId, SpellIds.${constName}, targetId);
if (${spell.name.toLowerCase().replace(/\s+/g, "")}.cast && ${spell.name.toLowerCase().replace(/\s+/g, "")}.consumedGCD) {
  return;
}`);
    } else {
      onInsert(`yield* tryCast(rotation, playerId, SpellIds.${constName});`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search spells..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <ScrollArea className="flex-1 -mx-1">
        <div className="space-y-1 px-1">
          {filteredSpells.map((spell) => (
            <div
              key={spell.id}
              className="group rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{spell.name}</span>
                    {!spell.gcd && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0"
                      >
                        Off-GCD
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ID: {spell.id}
                    </span>
                    {spell.cooldown > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {spell.cooldown}s
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Zap className="h-3 w-3" />
                      {spell.school}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleInsertId(spell)}
                    title="Insert spell ID"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleInsertCast(spell)}
                  >
                    Cast
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                {spell.description}
              </p>
            </div>
          ))}
          {filteredSpells.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No spells found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
