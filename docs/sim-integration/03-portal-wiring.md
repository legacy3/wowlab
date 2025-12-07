# Phase 3: Portal Wiring

> Connect the /simulate UI to the actual simulation API

## Goal

Replace mock data in `apps/portal/src/components/simulate/` with real API calls, connecting the existing UI components to the simulation backend from Phase 2.

---

## Current UI State

The `/simulate` page currently uses **MOCK_PARSED_DATA** and navigates to results with hardcoded mock timeline/chart data.

**Files to modify:**

```
apps/portal/src/
├── app/
│   └── simulate/
│       ├── page.tsx                      # Server component wrapper
│       └── results/[id]/page.tsx         # Results page
├── components/
│   └── simulate/
│       ├── quick-sim-content.tsx         # Main entry (MODIFY)
│       ├── simulation-result-tabs.tsx    # Results tabs
│       └── results-overview.tsx          # Stats display
├── atoms/
│   └── sim/
│       └── config.ts                     # Config atoms (KEEP)
├── hooks/
│   └── simulation/
│       ├── use-simulation.ts             # NEW: API hook
│       └── use-simulation-status.ts      # NEW: Polling hook
```

---

## Implementation

### Step 1: Create API Hooks

**Main simulation hook:**

```typescript
// apps/portal/src/hooks/simulation/use-simulation.ts

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface SimulationParams {
  rotationId: string;
  duration: number;
  iterations: number;
  fightType: "patchwerk" | "movement" | "aoe";
  character?: {
    name: string;
    class: string;
    spec: string;
  };
}

interface SimulationResponse {
  jobId: string;
  status: "queued" | "running";
  createdAt: string;
}

async function startSimulation(
  params: SimulationParams,
): Promise<SimulationResponse> {
  const response = await fetch("/api/simulations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Failed to start simulation");
  }

  return response.json();
}

export function useSimulation() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: startSimulation,
    onSuccess: (data) => {
      // Navigate to results page with job ID
      router.push(`/simulate/results/${data.jobId}`);
    },
  });

  return {
    startSimulation: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
```

**Status polling hook:**

```typescript
// apps/portal/src/hooks/simulation/use-simulation-status.ts

import { useQuery } from "@tanstack/react-query";

interface SimulationStatus {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  stats?: {
    meanDps: number;
    minDps: number;
    maxDps: number;
    stdDev: number;
    iterations: number;
    duration: number;
  };
  timeline?: TimelineData;
  charts?: ChartData;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

async function fetchSimulationStatus(jobId: string): Promise<SimulationStatus> {
  const response = await fetch(`/api/simulations/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Failed to fetch simulation status");
  }

  return response.json();
}

export function useSimulationStatus(jobId: string) {
  return useQuery({
    queryKey: ["simulation", jobId],
    queryFn: () => fetchSimulationStatus(jobId),
    // Poll every 500ms while running, stop when complete
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === "completed" ||
        status === "failed" ||
        status === "cancelled"
      ) {
        return false;
      }
      return 500;
    },
    // Don't refetch on window focus while polling
    refetchOnWindowFocus: false,
  });
}
```

### Step 2: Update QuickSimContent

Replace mock simulation trigger with real API call:

```typescript
// apps/portal/src/components/simulate/quick-sim-content.tsx

"use client";

import { useAtom } from "jotai";
import { fightDurationAtom, iterationsAtom, targetTypeAtom } from "@/atoms/sim/config";
import { useSimulation } from "@/hooks/simulation/use-simulation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function QuickSimContent() {
  // Existing atoms
  const [duration] = useAtom(fightDurationAtom);
  const [iterations] = useAtom(iterationsAtom);
  const [fightType] = useAtom(targetTypeAtom);

  // New simulation hook
  const { startSimulation, isLoading, error } = useSimulation();

  // Parsed character data (from SimC paste)
  const [parsedData, setParsedData] = useState<ParsedCharacter | null>(null);

  const handleRunSimulation = () => {
    if (!parsedData) return;

    startSimulation({
      rotationId: getRotationIdForSpec(parsedData.spec), // Map spec to rotation
      duration,
      iterations,
      fightType,
      character: {
        name: parsedData.name,
        class: parsedData.class,
        spec: parsedData.spec,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing SimC paste textarea */}
      <SimcPasteInput onParsed={setParsedData} />

      {/* Existing character + equipment display */}
      {parsedData && (
        <>
          <CharacterSummaryCard data={parsedData} />
          <EquipmentGrid data={parsedData} />
        </>
      )}

      {/* Fight profile selector (existing) */}
      <FightProfileSelector />

      {/* Advanced options (existing) */}
      <AdvancedOptions />

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      {/* Run button - updated */}
      <Button
        onClick={handleRunSimulation}
        disabled={!parsedData || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting Simulation...
          </>
        ) : (
          "Run Simulation"
        )}
      </Button>
    </div>
  );
}

// Helper to map spec names to rotation IDs
function getRotationIdForSpec(spec: string): string {
  const specMap: Record<string, string> = {
    "Beast Mastery": "beast-mastery",
    "Marksmanship": "marksmanship",
    "Survival": "survival",
    // Add more specs as rotations are implemented
  };
  return specMap[spec] ?? "beast-mastery"; // Default fallback
}
```

### Step 3: Update Results Page

Connect results page to polling hook:

```typescript
// apps/portal/src/app/simulate/results/[id]/page.tsx

import { Suspense } from "react";
import { SimulationResults } from "@/components/simulate/simulation-results";
import { SimulationResultsSkeleton } from "@/components/simulate/simulation-results-skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SimulationResultsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SimulationResultsSkeleton />}>
      <SimulationResults jobId={id} />
    </Suspense>
  );
}
```

```typescript
// apps/portal/src/components/simulate/simulation-results.tsx

"use client";

import { useSimulationStatus } from "@/hooks/simulation/use-simulation-status";
import { SimulationProgress } from "./simulation-progress";
import { SimulationResultTabs } from "./simulation-result-tabs";
import { SimulationError } from "./simulation-error";

interface Props {
  jobId: string;
}

export function SimulationResults({ jobId }: Props) {
  const { data, isLoading, error } = useSimulationStatus(jobId);

  // Loading state
  if (isLoading && !data) {
    return <SimulationResultsSkeleton />;
  }

  // Error state
  if (error) {
    return <SimulationError message={error.message} />;
  }

  // Job not found
  if (!data) {
    return <SimulationError message="Simulation not found" />;
  }

  // Running/queued - show progress
  if (data.status === "queued" || data.status === "running") {
    return (
      <SimulationProgress
        status={data.status}
        progress={data.progress}
        createdAt={data.createdAt}
      />
    );
  }

  // Failed
  if (data.status === "failed") {
    return <SimulationError message={data.error ?? "Simulation failed"} />;
  }

  // Cancelled
  if (data.status === "cancelled") {
    return <SimulationError message="Simulation was cancelled" />;
  }

  // Completed - show results
  return (
    <SimulationResultTabs
      stats={data.stats!}
      timeline={data.timeline!}
      charts={data.charts!}
    />
  );
}
```

### Step 4: Create Progress Component

Show simulation progress while running:

```typescript
// apps/portal/src/components/simulate/simulation-progress.tsx

"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  status: "queued" | "running";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  createdAt: string;
}

export function SimulationProgress({ status, progress, createdAt }: Props) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {status === "queued" ? "Queued" : "Running Simulation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress && (
            <>
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {progress.current.toLocaleString()} / {progress.total.toLocaleString()} iterations
                </span>
                <span>{progress.percentage}%</span>
              </div>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            Started {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 5: Update Result Tabs to Use Real Data

```typescript
// apps/portal/src/components/simulate/simulation-result-tabs.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsOverview } from "./results-overview";
import { TimelineContent } from "./results/timeline/timeline-content";
import { ChartsContent } from "./results/charts/charts-content";

interface Props {
  stats: SimulationStats;
  timeline: TimelineData;
  charts: ChartData;
}

export function SimulationResultTabs({ stats, timeline, charts }: Props) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ResultsOverview stats={stats} />
      </TabsContent>

      <TabsContent value="timeline">
        <TimelineContent data={timeline} />
      </TabsContent>

      <TabsContent value="charts">
        <ChartsContent data={charts} />
      </TabsContent>
    </Tabs>
  );
}
```

### Step 6: Wire Timeline Atoms to Real Data

Instead of using hardcoded mock data, hydrate atoms from API response:

```typescript
// apps/portal/src/components/simulate/results/timeline/timeline-content.tsx

"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import {
  timelineCastsAtom,
  timelineBuffsAtom,
  timelineDebuffsAtom,
  timelineDamageAtom,
} from "@/atoms/timeline/state";
import { Timeline } from "./timeline";

interface Props {
  data: TimelineData;
}

export function TimelineContent({ data }: Props) {
  const setCasts = useSetAtom(timelineCastsAtom);
  const setBuffs = useSetAtom(timelineBuffsAtom);
  const setDebuffs = useSetAtom(timelineDebuffsAtom);
  const setDamage = useSetAtom(timelineDamageAtom);

  // Hydrate atoms from API data
  useEffect(() => {
    setCasts(data.casts);
    setBuffs(data.buffs);
    setDebuffs(data.debuffs);
    setDamage(data.damage);
  }, [data, setCasts, setBuffs, setDebuffs, setDamage]);

  return <Timeline />;
}
```

---

## Jotai Atoms Update

Update config atoms to support the new flow:

```typescript
// apps/portal/src/atoms/sim/config.ts

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Persisted config
export const fightDurationAtom = atomWithStorage("sim-duration", 300);
export const iterationsAtom = atomWithStorage("sim-iterations", 1000);
export const targetTypeAtom = atomWithStorage<"patchwerk" | "movement" | "aoe">(
  "sim-target-type",
  "patchwerk",
);

// Current job state (not persisted)
export const currentJobIdAtom = atom<string | null>(null);
export const simulationStatusAtom = atom<SimulationStatus | null>(null);
```

---

## Component Tree

```
/simulate
├── page.tsx (server)
│   └── QuickSimContent (client)
│       ├── SimcPasteInput
│       ├── CharacterSummaryCard
│       ├── EquipmentGrid
│       ├── FightProfileSelector
│       ├── AdvancedOptions
│       └── Button "Run Simulation" → useSimulation()
│
/simulate/results/[id]
├── page.tsx (server)
│   └── SimulationResults (client)
│       ├── SimulationProgress (if running)
│       │   └── Progress bar + status
│       └── SimulationResultTabs (if completed)
│           ├── ResultsOverview
│           │   └── Stats cards (DPS, etc.)
│           ├── TimelineContent
│           │   └── Konva Timeline
│           └── ChartsContent
│               └── Recharts visualizations
```

---

## Migration Checklist

- [ ] Create `hooks/simulation/use-simulation.ts`
- [ ] Create `hooks/simulation/use-simulation-status.ts`
- [ ] Update `QuickSimContent` to use `useSimulation()`
- [ ] Update results page to use `useSimulationStatus()`
- [ ] Create `SimulationProgress` component
- [ ] Create `SimulationError` component
- [ ] Update `SimulationResultTabs` to accept props instead of atoms
- [ ] Update `TimelineContent` to hydrate atoms from API data
- [ ] Update `ChartsContent` to use API data
- [ ] Remove mock data constants
- [ ] Test full flow: paste → configure → run → view results

---

## Success Criteria

1. User can paste SimC export and see character/equipment
2. "Run Simulation" calls POST /api/simulations
3. User navigates to /simulate/results/[jobId]
4. Progress bar shows while simulation runs
5. Results display in Overview, Timeline, Charts tabs
6. All existing UI components work with real data

---

## Skeleton Components

Create loading skeletons for Suspense boundaries:

```typescript
// apps/portal/src/components/simulate/simulation-results-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SimulationResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Next Steps

→ [Phase 4: Streaming & Progress](./04-streaming-progress.md)
