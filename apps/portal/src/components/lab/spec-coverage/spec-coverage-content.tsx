"use client";

import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  specCoverageOrderAtom,
  type SpecCoverageCardId,
} from "@/atoms/spec-coverage";
import { useSpecCoverage } from "@/hooks/use-spec-coverage";
import { OverviewCard, MatrixCard, UntrackedCard } from "./cards";

const components: DashboardConfig<SpecCoverageCardId> = {
  overview: { Component: OverviewCard },
  matrix: { Component: MatrixCard },
  untracked: { Component: UntrackedCard },
};

export function SpecCoverageContent() {
  const [order, setOrder] = useAtom(specCoverageOrderAtom);
  const { data, loading, error, progress, fetch } = useSpecCoverage();

  const progressPercent = useMemo(() => {
    if (!progress || progress.total === 0) {
      return 0;
    }
    return Math.round((progress.loaded / progress.total) * 100);
  }, [progress]);

  const handleLoadData = useCallback(() => {
    if (!loading) {
      void fetch();
    }
  }, [fetch, loading]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        {loading ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium flex items-center justify-center gap-1">
                {progress ? (
                  <>
                    {progress.className}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    {progress.specName}
                  </>
                ) : (
                  "Initializing..."
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress
                  ? `${progress.loaded} of ${progress.total} specs (${progressPercent}%)`
                  : "Fetching class data..."}
              </p>
            </div>
            <Progress value={progressPercent} className="h-1.5 w-64" />
          </>
        ) : (
          <Card className="max-w-lg">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">What you&apos;ll see</h3>
                <p className="text-sm text-muted-foreground">
                  A breakdown of which spells from each class/spec are currently
                  supported by the simulator. Useful if you want to check
                  whether your spec is ready to simulate.
                </p>
              </div>

              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">•</span>
                  Overall coverage % across all specs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">•</span>
                  Per-class and per-spec coverage breakdown
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">•</span>
                  Click any spec to see which spells are supported/missing
                </li>
              </ul>

              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={handleLoadData} size="lg" className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Load Coverage Data
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Only use this if you actually need to check coverage. This is
                  a large database request.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">
                  Failed to load: {error}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4"
    />
  );
}
