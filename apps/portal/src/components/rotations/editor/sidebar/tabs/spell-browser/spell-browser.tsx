"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Clock, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MOCK_SPELLS,
  generateSpellIdSnippet,
  generateCastSnippet,
  type Spell,
} from "./spell-browser.data";

interface SpellBrowserProps {
  onInsert: (snippet: string) => void;
}

export function SpellBrowser({ onInsert }: SpellBrowserProps) {
  const [search, setSearch] = useState("");

  const filteredSpells = useMemo(() => {
    if (!search) {
      return MOCK_SPELLS;
    }
    const lower = search.toLowerCase();
    return MOCK_SPELLS.filter(
      (spell) =>
        spell.name.toLowerCase().includes(lower) ||
        spell.id.toString().includes(lower),
    );
  }, [search]);

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
            <SpellCard key={spell.id} spell={spell} onInsert={onInsert} />
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

interface SpellCardProps {
  spell: Spell;
  onInsert: (snippet: string) => void;
}

function SpellCard({ spell, onInsert }: SpellCardProps) {
  return (
    <div className="group rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{spell.name}</span>
            {!spell.gcd && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
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
            onClick={() => onInsert(generateSpellIdSnippet(spell))}
            title="Insert spell ID"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onInsert(generateCastSnippet(spell))}
          >
            Cast
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
        {spell.description}
      </p>
    </div>
  );
}
