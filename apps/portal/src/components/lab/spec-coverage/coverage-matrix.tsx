"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { getCoverageColor, getCoverageTextColor } from "@/lib/utils/coverage";
import {
  useSpecCoverage,
  type SpecCoverageClass,
  type SpecCoverageSpell,
} from "@/hooks/use-spec-coverage";
import { calculateCoverage, getCounts } from "@/lib/spec-coverage";
import { WowSpellLink } from "@/components/game";
import { GithubSearchLink } from "@/components/shared/github-search-link";

interface SelectedSpec {
  className: string;
  classColor: string;
  specName: string;
  spells: SpecCoverageSpell[];
}

interface SpecCellProps {
  spec: {
    id: number;
    name: string;
    spells: SpecCoverageSpell[];
  };
  className: string;
  classColor: string;
  onSelect: (spec: SelectedSpec) => void;
}

function SpecCell({ spec, className, classColor, onSelect }: SpecCellProps) {
  const coverage = calculateCoverage(spec.spells);
  const counts = getCounts(spec.spells);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              onSelect({
                className,
                classColor,
                specName: spec.name,
                spells: spec.spells,
              })
            }
            className={cn(
              "flex h-8 w-full cursor-pointer items-center justify-center rounded-sm transition-all hover:scale-105 hover:brightness-110",
              getCoverageColor(coverage),
              "text-white font-medium text-xs",
            )}
          >
            <span className="hidden sm:inline">{coverage}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <div className="space-y-2">
            <div className="font-semibold">
              {spec.name} {className}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="opacity-70">Coverage</span>
              <span className="font-semibold text-right">{coverage}%</span>
              <span className="opacity-70">Supported</span>
              <span className="font-medium text-right">{counts.supported}</span>
              <span className="opacity-70">Missing</span>
              <span className="font-medium text-right">
                {counts.total - counts.supported}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Click to view spells
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ClassRowProps {
  cls: SpecCoverageClass;
  maxSpecs: number;
  onSelectSpec: (spec: SelectedSpec) => void;
}

function ClassRow({ cls, maxSpecs, onSelectSpec }: ClassRowProps) {
  const allSpells = cls.specs.flatMap((s) => s.spells);
  const classCoverage = calculateCoverage(allSpells);

  return (
    <div className="flex items-center gap-1.5">
      {/* Class name column */}
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cls.color }}
        />
        <span className="truncate text-xs font-medium">{cls.name}</span>
      </div>

      {/* Class total */}
      <div
        className={cn(
          "w-10 shrink-0 text-center text-xs font-semibold tabular-nums",
          getCoverageTextColor(classCoverage),
        )}
      >
        {classCoverage}%
      </div>

      {/* Spec cells */}
      <div className="flex flex-1 gap-2">
        {cls.specs.map((spec) => (
          <div key={spec.id} className="flex-1 min-w-[40px] p-0.5">
            <SpecCell
              spec={spec}
              className={cls.name}
              classColor={cls.color}
              onSelect={onSelectSpec}
            />
          </div>
        ))}
        {/* Empty cells for alignment */}
        {Array.from({ length: maxSpecs - cls.specs.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 min-w-[40px] p-0.5" />
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-rose-500", label: "0-30" },
    { color: "bg-amber-500", label: "30-50" },
    { color: "bg-amber-400", label: "50-70" },
    { color: "bg-emerald-400", label: "70-90" },
    { color: "bg-emerald-500", label: "90+" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide opacity-70">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <span className={cn("h-3 w-3 rounded-sm", color)} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function SpellListDialog({
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

  const normalizedSearch = search.trim().toLowerCase();

  const visibleSpells = useMemo(() => {
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

    if (!normalizedSearch) {
      return statusFiltered;
    }

    return statusFiltered.filter((s) => {
      const id = String(s.id);
      const name = s.name.toLowerCase();

      return name.includes(normalizedSearch) || id.includes(normalizedSearch);
    });
  }, [spec, hidePassives, statusFilter, normalizedSearch]);

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

  if (!spec) {
    return null;
  }

  const supportedCount = visibleSpells.filter((s) => s.supported).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[calc(100vw-4rem)] md:max-w-[1200px] lg:max-w-[1400px] h-[90vh] grid-rows-[auto_1fr] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: spec.classColor }}
            />
            {spec.specName} {spec.className}
          </DialogTitle>
          <DialogDescription>
            {supportedCount} of {visibleSpells.length} spells supported (
            {visibleSpells.length > 0
              ? Math.round((supportedCount / visibleSpells.length) * 100)
              : 0}
            %)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full">
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
                  <ToggleGroupItem value="supported">Supported</ToggleGroupItem>
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
                            {groupSupported} supported • {group.spells.length}{" "}
                            total
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="px-3 pb-3">
                      <ul className="pt-1 columns-1 sm:columns-2 lg:columns-3 [column-gap:1.5rem]">
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
      </DialogContent>
    </Dialog>
  );
}

export function CoverageMatrix() {
  const { data, loading, error } = useSpecCoverage();
  const [selectedSpec, setSelectedSpec] = useState<SelectedSpec | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const maxSpecs = useMemo(() => {
    if (!data) {
      return 0;
    }
    return Math.max(...data.classes.map((cls) => cls.specs.length));
  }, [data]);

  const handleSelectSpec = (spec: SelectedSpec) => {
    setSelectedSpec(spec);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading coverage matrix...
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error: {error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {/* Legend */}
        <div className="flex justify-end">
          <Legend />
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {data.classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              maxSpecs={maxSpecs}
              onSelectSpec={handleSelectSpec}
            />
          ))}
        </div>
      </div>

      <SpellListDialog
        spec={selectedSpec}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
