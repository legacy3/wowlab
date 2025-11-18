"use client";

import { Suspense, useMemo } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useAtom } from "jotai";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Compass,
  Flag,
  Layers3,
  Map,
  Mountain,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  sourceGroupsAtom,
  allSourceTilesAtom,
  selectedSourcesAtom,
  showPreviousTiersAtom,
  type SourceTile,
  type SourceGroup,
} from "@/atoms/drop-optimizer";

const TILE_ICON: Record<SourceTile["type"], React.ElementType> = {
  raid: Flag,
  dungeon: Map,
  vendor: Layers3,
  seasonal: Mountain,
  pvp: Compass,
};

function DropOptimizerContentInner() {
  const [sourceGroups] = useAtom(sourceGroupsAtom);
  const [allSourceTiles] = useAtom(allSourceTilesAtom);
  const [selectedSources, setSelectedSources] = useAtom(selectedSourcesAtom);
  const [showPreviousTiers, setShowPreviousTiers] = useAtom(
    showPreviousTiersAtom,
  );

  const visibleGroups = useMemo(
    () =>
      sourceGroups.filter((group) =>
        showPreviousTiers ? true : group.tier === "current",
      ),
    [sourceGroups, showPreviousTiers],
  );

  const selectedTiles = useMemo(
    () =>
      allSourceTiles
        .filter((source) => selectedSources.has(source.id))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allSourceTiles, selectedSources],
  );

  const toggleSource = (sourceId: string) => {
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    const group = sourceGroups.find((entry) => entry.id === groupId);
    if (!group) {
      return;
    }

    setSelectedSources((current) => {
      const next = new Set(current);
      const everySelected = group.sources.every((source) =>
        next.has(source.id),
      );

      if (everySelected) {
        group.sources.forEach((source) => next.delete(source.id));
      } else {
        group.sources.forEach((source) => next.add(source.id));
      }

      return next;
    });
  };

  const estimatedBosses = selectedTiles.reduce(
    (acc, source) => acc + source.bosses,
    0,
  );
  const estimatedDrops = selectedTiles.reduce(
    (acc, source) => acc + source.lootCount,
    0,
  );
  const canRun = selectedTiles.length > 0;

  const groupSelectionState = (group: SourceGroup): CheckedState => {
    const selectedCount = group.sources.filter((source) =>
      selectedSources.has(source.id),
    ).length;

    if (selectedCount === 0) {
      return false;
    }

    if (selectedCount === group.sources.length) {
      return true;
    }

    return "indeterminate";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Choose Sources</CardTitle>
            <CardDescription>
              Select the content pools to evaluate against your current gear.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Select:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedSources(
                  new Set(
                    allSourceTiles
                      .filter((entry) =>
                        showPreviousTiers ? true : entry.tier === "current",
                      )
                      .map((entry) => entry.id),
                  ),
                )
              }
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedSources(
                  new Set(["khaz-algar", "mythic-plus", "catalyst-season3"]),
                )
              }
            >
              Default
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSources(new Set())}
            >
              None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedTiles.length > 0 ? (
              <>
                Evaluating{" "}
                <span className="font-medium">{selectedTiles.length}</span>{" "}
                sources covering{" "}
                <span className="font-medium">{estimatedBosses}</span> bosses
                and <span className="font-medium">{estimatedDrops}</span>{" "}
                potential drops.
              </>
            ) : (
              "Select at least one source to begin calculating drop priorities."
            )}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="show-previous"
              checked={showPreviousTiers}
              onCheckedChange={(checked) =>
                setShowPreviousTiers(Boolean(checked))
              }
            />
            <label htmlFor="show-previous" className="cursor-pointer">
              Show previous tiers
            </label>
          </div>
        </div>

        <div className="space-y-6">
          {visibleGroups.map((group) => {
            const selectionState = groupSelectionState(group);

            return (
              <section key={group.id} className="space-y-3">
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={selectionState}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <label
                        htmlFor={`group-${group.id}`}
                        className="cursor-pointer text-sm font-semibold"
                      >
                        {group.label}
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.id)}
                    className="self-start sm:self-center"
                  >
                    {selectionState === true
                      ? "Deselect group"
                      : "Select group"}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.sources.map((source) => {
                    const isSelected = selectedSources.has(source.id);
                    const Icon = TILE_ICON[source.type];

                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => toggleSource(source.id)}
                        className={cn(
                          "group flex flex-col gap-3 rounded-xl border bg-background p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                          isSelected &&
                            "border-primary bg-primary/5 ring-2 ring-primary/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {source.label}
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-muted-foreground/40" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {source.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {source.lootCount} drops
                          </div>
                          {source.bosses > 0 && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {source.bosses} bosses
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[0.65rem] uppercase"
                          >
                            {source.tier === "current"
                              ? "Season 3"
                              : "Previous"}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {canRun
            ? "Ready to evaluate upgrade potential across the selected content pools."
            : "Select at least one source above to enable the optimizer."}
        </div>
        <Button size="lg" disabled={!canRun}>
          Run Drop Optimizer
        </Button>
      </CardFooter>
    </Card>
  );
}

function DropOptimizerContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/40 px-6 py-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function DropOptimizerContent() {
  return (
    <Suspense fallback={<DropOptimizerContentSkeleton />}>
      <DropOptimizerContentInner />
    </Suspense>
  );
}
