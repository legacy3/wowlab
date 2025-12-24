"use client";

import { useState } from "react";
import { Search, Loader2, Wand2, Package, Sparkles } from "lucide-react";
import { Link } from "@/components/ui/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataInspector } from "@/hooks/use-data-inspector";
import { useSpellDescription } from "@/hooks/use-spell-description";
import type { DataType } from "@/atoms/lab";
import type { Spell } from "@wowlab/core/Schemas";

function isSpellData(data: unknown): data is Spell.SpellDataFlat {
  return (
    data !== null &&
    typeof data === "object" &&
    "castTime" in data &&
    "recoveryTime" in data
  );
}

export function DataInspector() {
  const [search, setSearch] = useState("");
  const { id, setId, type, setType, loading, error, data, query } =
    useDataInspector();
  const { data: spellDescription, isLoading: spellDescriptionLoading } =
    useSpellDescription(type === "spell" && id > 0 ? id : null);

  const handleSearch = () => {
    const asNumber = parseInt(search, 10);
    if (!isNaN(asNumber) && asNumber > 0) {
      setId(asNumber);
      queueMicrotask(() => query());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <Tabs value={type} onValueChange={(v) => setType(v as DataType)}>
        <TabsList className="w-full h-8">
          <TabsTrigger value="spell" className="flex-1 gap-1 text-xs h-6">
            <Wand2 className="h-3 w-3" />
            Spell
          </TabsTrigger>
          <TabsTrigger value="item" className="flex-1 gap-1 text-xs h-6">
            <Package className="h-3 w-3" />
            Item
          </TabsTrigger>
          <TabsTrigger value="aura" className="flex-1 gap-1 text-xs h-6">
            <Sparkles className="h-3 w-3" />
            Aura
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} ID...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8 h-8 text-sm"
          type="number"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center py-2">{error}</p>
      )}

      {data && !loading && (
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm">
                {"name" in data ? data.name : `${type} ${id}`}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {"id" in data ? String(data.id) : id}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              {type}
            </Badge>
          </div>

          {isSpellData(data) && (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Cooldown</p>
                  <p className="font-medium">
                    {data.recoveryTime > 0
                      ? `${data.recoveryTime / 1000}s`
                      : "None"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Cast Time</p>
                  <p className="font-medium">
                    {data.castTime > 0 ? `${data.castTime / 1000}s` : "Instant"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Range</p>
                  <p className="font-medium">
                    {data.rangeMax0 > 0 ? `${data.rangeMax0} yd` : "Self"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">GCD</p>
                  <p className="font-medium">
                    {data.startRecoveryTime > 0
                      ? `${data.startRecoveryTime / 1000}s`
                      : "Off-GCD"}
                  </p>
                </div>
              </div>

              {(spellDescription ||
                data.description ||
                spellDescriptionLoading) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-xs">
                    {spellDescriptionLoading && !spellDescription
                      ? "Loading description..."
                      : (spellDescription?.text ??
                        data.description ??
                        "No description available.")}
                  </p>
                </div>
              )}
            </>
          )}

          <Link href={`/lab/inspector/${type}/${id}`} className="text-xs">
            View in Inspector
          </Link>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Search for a {type} by ID</p>
          <p className="text-xs mt-1">Enter an ID and press Enter</p>
        </div>
      )}
    </div>
  );
}
