"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SpellDetails {
  id: number;
  name: string;
  cooldown: number;
  gcd: boolean;
  castTime: number;
  range: number;
  cost: { type: string; amount: number } | null;
  school: string;
  effects: string[];
}

// Mock data - would come from your WoW MCP in real implementation
const MOCK_SPELL_DATABASE: Record<number, SpellDetails> = {
  217200: {
    id: 217200,
    name: "Barbed Shot",
    cooldown: 12,
    gcd: true,
    castTime: 0,
    range: 40,
    cost: { type: "Focus", amount: 0 },
    school: "Physical",
    effects: [
      "Deals Physical damage over 8 sec",
      "Generates 5 Focus over 8 sec",
      "Reduces Bestial Wrath cooldown by 12 sec",
    ],
  },
  19574: {
    id: 19574,
    name: "Bestial Wrath",
    cooldown: 90,
    gcd: false,
    castTime: 0,
    range: 0,
    cost: null,
    school: "Physical",
    effects: [
      "You and your pet deal 25% increased damage",
      "Your pet deals 50% increased damage",
      "Lasts 15 sec",
    ],
  },
  34026: {
    id: 34026,
    name: "Kill Command",
    cooldown: 7.5,
    gcd: true,
    castTime: 0,
    range: 50,
    cost: { type: "Focus", amount: 30 },
    school: "Physical",
    effects: [
      "Commands your pet to attack",
      "Deals Physical damage",
      "Has 2 charges",
    ],
  },
  193455: {
    id: 193455,
    name: "Cobra Shot",
    cooldown: 0,
    gcd: true,
    castTime: 0,
    range: 40,
    cost: { type: "Focus", amount: 35 },
    school: "Nature",
    effects: ["Deals Nature damage", "Reduces Kill Command cooldown by 1 sec"],
  },
};

export function DataInspector() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<SpellDetails | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    setNotFound(false);

    // Try to find by ID first
    const asNumber = parseInt(search, 10);
    if (!isNaN(asNumber) && MOCK_SPELL_DATABASE[asNumber]) {
      setResult(MOCK_SPELL_DATABASE[asNumber]);
      return;
    }

    // Try to find by name
    const lower = search.toLowerCase();
    const found = Object.values(MOCK_SPELL_DATABASE).find((spell) =>
      spell.name.toLowerCase().includes(lower),
    );

    if (found) {
      setResult(found);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Spell name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {notFound && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Spell not found. Try another search.
        </p>
      )}

      {result && (
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{result.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {result.id}
              </p>
            </div>
            <div className="flex gap-1">
              {!result.gcd && (
                <Badge variant="secondary" className="text-[10px]">
                  Off-GCD
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {result.school}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Cooldown</p>
              <p className="font-medium">
                {result.cooldown > 0 ? `${result.cooldown}s` : "None"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Cast Time</p>
              <p className="font-medium">
                {result.castTime > 0 ? `${result.castTime}s` : "Instant"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Range</p>
              <p className="font-medium">
                {result.range > 0 ? `${result.range} yd` : "Self"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Cost</p>
              <p className="font-medium">
                {result.cost
                  ? `${result.cost.amount} ${result.cost.type}`
                  : "None"}
              </p>
            </div>
          </div>

          {result.effects.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Effects</p>
              <ul className="text-xs space-y-0.5">
                {result.effects.map((effect, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-muted-foreground">•</span>
                    {effect}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            href={`https://www.wowhead.com/spell=${result.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View on Wowhead
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {!result && !notFound && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Search for a spell by name or ID</p>
          <p className="text-xs mt-1">
            Try: "Kill Command", "Bestial Wrath", or "34026"
          </p>
        </div>
      )}
    </div>
  );
}
