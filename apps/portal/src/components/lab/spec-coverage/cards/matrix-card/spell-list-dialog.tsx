"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Search,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { WowSpellLink } from "@/components/game";
import { GithubSearchLink } from "@/components/shared/github-search-link";
import { useJsonExport } from "@/hooks/use-json-export";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { GAME_CONFIG } from "@/lib/config/game";

import type { SpecCoverageSpell } from "@/hooks/use-spec-coverage";
import type { SelectedSpec } from "./types";

export function SpellListDialog({
  spec,
  open,
  onOpenChange,
}: {
  spec: SelectedSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [hidePassives, setHidePassives] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "supported" | "missing"
  >("all");
  const [search, setSearch] = useState("");

  const preFilteredSpells = useMemo(() => {
    const spells = spec?.spells ?? [];

    const passivesFiltered = hidePassives
      ? spells.filter((s) => !s.isPassive)
      : spells;

    const statusFiltered =
      statusFilter === "supported"
        ? passivesFiltered.filter((s) => s.supported)
        : statusFilter === "missing"
          ? passivesFiltered.filter((s) => !s.supported)
          : passivesFiltered;

    return statusFiltered;
  }, [spec, hidePassives, statusFilter]);

  const { results: visibleSpells } = useFuzzySearch({
    items: preFilteredSpells,
    query: search,
    keys: ["name", "id"],
    threshold: 0.3,
  });

  const groups = useMemo(() => {
    const grouped = new Map<
      "talent" | "spec" | "class" | "unknown",
      SpecCoverageSpell[]
    >();

    for (const spell of visibleSpells) {
      const source = spell.knowledgeSource.source;
      const existing = grouped.get(source) ?? [];

      existing.push(spell);
      grouped.set(source, existing);
    }

    const ordered: Array<{
      key: "talent" | "spec" | "class" | "unknown";
      label: string;
      spells: SpecCoverageSpell[];
    }> = [
      { key: "talent", label: "Talent", spells: grouped.get("talent") ?? [] },
      { key: "spec", label: "Spec", spells: grouped.get("spec") ?? [] },
      { key: "class", label: "Class", spells: grouped.get("class") ?? [] },
      {
        key: "unknown",
        label: "Unknown",
        spells: grouped.get("unknown") ?? [],
      },
    ];

    for (const group of ordered) {
      group.spells.sort((a, b) => a.name.localeCompare(b.name));
    }

    return ordered;
  }, [visibleSpells]);

  const exportData = useMemo(
    () =>
      spec
        ? {
            classColor: spec.classColor,
            classId: spec.classId,
            className: spec.className,
            filters: {
              hidePassives,
              search,
              status: statusFilter,
            },
            specId: spec.specId,
            specName: spec.specName,
            spells: spec.spells,
            visibleSpellIds: visibleSpells.map((s) => s.id),
          }
        : null,
    [spec, hidePassives, search, statusFilter, visibleSpells],
  );

  const { exportJson, downloadJson } = useJsonExport({
    data: exportData,
    filenamePrefix: "spec-coverage-spec",
    filenameTag: spec ? String(spec.specId) : undefined,
    patchVersion: GAME_CONFIG.patchVersion,
    label: "Spell List",
    resetKey: spec ? spec.specId : null,
  });

  const supportedCount = visibleSpells.filter((s) => s.supported).length;

  return (
    <Dialog open={open && !!spec} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[calc(100vw-4rem)] md:max-w-[1200px] lg:max-w-[1400px] h-[90vh] grid-rows-[auto_1fr] overflow-hidden">
        {spec && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: spec.classColor }}
                  />
                  <span className="truncate">
                    {spec.specName} {spec.className}
                  </span>
                </div>
                {exportJson && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CopyButton
                      value={exportJson}
                      label="spell list"
                      title="Copy spell list"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      onClick={downloadJson}
                      title="Download spec coverage JSON"
                    >
                      <Download />
                    </Button>
                  </div>
                )}
              </DialogTitle>
              <DialogDescription>
                {supportedCount} of {visibleSpells.length} spells supported (
                {visibleSpells.length > 0
                  ? Math.round((supportedCount / visibleSpells.length) * 100)
                  : 0}
                %)
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-full min-h-0">
              <div className="space-y-4 pr-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <ToggleGroup
                      type="single"
                      value={statusFilter}
                      onValueChange={(v) =>
                        setStatusFilter(
                          v === "supported" || v === "missing" || v === "all"
                            ? v
                            : "all",
                        )
                      }
                      variant="outline"
                      size="sm"
                    >
                      <ToggleGroupItem value="all">All</ToggleGroupItem>
                      <ToggleGroupItem value="supported">
                        Supported
                      </ToggleGroupItem>
                      <ToggleGroupItem value="missing">Missing</ToggleGroupItem>
                    </ToggleGroup>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Hide passives
                      </span>
                      <Switch
                        checked={hidePassives}
                        onCheckedChange={setHidePassives}
                      />
                    </div>
                  </div>

                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter spells..."
                      className="pl-9"
                    />
                  </div>
                </div>

                {groups
                  .filter((g) => g.spells.length > 0)
                  .map((group) => {
                    const groupSupported = group.spells.filter(
                      (s) => s.supported,
                    ).length;

                    return (
                      <Collapsible
                        key={group.key}
                        defaultOpen={group.key !== "unknown"}
                        className="rounded-md border"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium">
                                {group.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {groupSupported} supported •{" "}
                                {group.spells.length} total
                              </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="px-3 pb-3">
                          <ul className="pt-1 columns-1 sm:columns-2 lg:columns-3 gap-x-6">
                            {group.spells.map((spell) => (
                              <li
                                key={spell.id}
                                className={cn(
                                  "break-inside-avoid mb-1 group grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-muted/30",
                                  !spell.supported && "text-muted-foreground",
                                )}
                              >
                                {spell.supported ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-rose-500" />
                                )}
                                <div className="min-w-0">
                                  <WowSpellLink spellId={spell.id} />
                                </div>
                                <div className="flex items-center justify-end gap-2 tabular-nums">
                                  {!hidePassives && spell.isPassive && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Passive
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {spell.id}
                                  </span>
                                  <GithubSearchLink
                                    query={`"${spell.id}"`}
                                    label={String(spell.id)}
                                    mode="icon"
                                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
