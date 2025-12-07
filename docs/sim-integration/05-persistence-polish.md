# Phase 5: Persistence & Polish

> Save simulation results to Supabase and add polish features

## Goal

Complete the integration by:

1. Persisting simulation results to Supabase
2. Enabling simulation history and comparison
3. Adding observability (logs, spans)
4. Implementing rate limiting and error recovery
5. Polish UX details

---

## Database Schema

### Existing Table: `rotation_sim_results`

```sql
-- Already exists in Supabase
CREATE TABLE rotation_sim_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID REFERENCES rotations(id),
  user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Config
  duration INTEGER NOT NULL,           -- Seconds
  iterations INTEGER NOT NULL,
  fight_type TEXT NOT NULL,            -- 'patchwerk' | 'movement' | 'aoe'
  scenario JSONB,                      -- Additional config
  gear_set JSONB,                      -- Character equipment snapshot
  patch TEXT,                          -- Game patch version
  sim_version TEXT,                    -- Engine version

  -- Results
  mean_dps NUMERIC NOT NULL,
  min_dps NUMERIC NOT NULL,
  max_dps NUMERIC NOT NULL,
  std_dev NUMERIC NOT NULL,
  stat_weights JSONB,                  -- Optional stat weights

  -- Large data (stored separately or compressed)
  timeline JSONB,                      -- Full timeline data
  charts JSONB                         -- Chart data
);

-- Indexes
CREATE INDEX idx_sim_results_rotation ON rotation_sim_results(rotation_id);
CREATE INDEX idx_sim_results_user ON rotation_sim_results(user_id);
CREATE INDEX idx_sim_results_created ON rotation_sim_results(created_at DESC);
```

### New Table: `simulation_jobs`

Track job state for recovery:

```sql
CREATE TABLE simulation_jobs (
  id TEXT PRIMARY KEY,                 -- nanoid
  user_id UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL,                -- 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

  -- Config
  rotation_id TEXT NOT NULL,           -- Rotation slug or UUID
  duration INTEGER NOT NULL,
  iterations INTEGER NOT NULL,
  fight_type TEXT NOT NULL,
  character_data JSONB,

  -- Progress
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER NOT NULL,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Result reference
  result_id UUID REFERENCES rotation_sim_results(id),
  error_message TEXT
);

CREATE INDEX idx_jobs_user ON simulation_jobs(user_id);
CREATE INDEX idx_jobs_status ON simulation_jobs(status);
CREATE INDEX idx_jobs_created ON simulation_jobs(created_at DESC);
```

---

## Implementation

### Step 1: Create Supabase Repository

```typescript
// apps/portal/src/lib/simulation/repository.ts

import { createClient } from "@/lib/supabase/server";
import type { SimulationJob, SimulationResult } from "./types";

export const SimulationRepository = {
  // Jobs
  async createJob(job: Omit<SimulationJob, "id">): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulation_jobs")
      .insert(job)
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateJob(id: string, updates: Partial<SimulationJob>): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("simulation_jobs")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async getJob(id: string): Promise<SimulationJob | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulation_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error?.code === "PGRST116") return null; // Not found
    if (error) throw error;
    return data;
  },

  async getUserJobs(userId: string, limit = 10): Promise<SimulationJob[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulation_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  // Results
  async saveResult(result: Omit<SimulationResult, "id">): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rotation_sim_results")
      .insert(result)
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  },

  async getResult(id: string): Promise<SimulationResult | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rotation_sim_results")
      .select("*")
      .eq("id", id)
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  },

  async getRotationResults(
    rotationId: string,
    limit = 20,
  ): Promise<SimulationResult[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rotation_sim_results")
      .select("*")
      .eq("rotation_id", rotationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async getUserResults(
    userId: string,
    limit = 20,
  ): Promise<SimulationResult[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rotation_sim_results")
      .select("*, rotations(name, spec)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
};
```

### Step 2: Update Job Manager with Persistence

```typescript
// apps/portal/src/lib/simulation/job-manager.ts

import { SimulationRepository } from "./repository";

export const JobManager = {
  async create(config: CreateSimulationRequest, userId?: string): Promise<Job> {
    const id = nanoid(12);

    // Save to database
    await SimulationRepository.createJob({
      id,
      user_id: userId,
      status: "queued",
      rotation_id: config.rotationId,
      duration: config.duration,
      iterations: config.iterations,
      fight_type: config.fightType,
      character_data: config.character,
      progress_current: 0,
      progress_total: config.iterations,
      created_at: new Date().toISOString(),
    });

    // Also store in memory for fast access
    const job: Job = {
      id,
      userId,
      status: "queued",
      config: {
        /* ... */
      },
      progress: { current: 0, total: config.iterations },
      createdAt: new Date(),
    };

    jobs.set(id, job);
    this.execute(job);

    return job;
  },

  async execute(job: Job): Promise<void> {
    job.status = "running";
    job.startedAt = new Date();

    // Update database
    await SimulationRepository.updateJob(job.id, {
      status: "running",
      started_at: job.startedAt.toISOString(),
    });

    try {
      // ... existing execution logic ...

      // On completion, save results
      const resultId = await SimulationRepository.saveResult({
        rotation_id: job.config.rotationId,
        user_id: job.userId,
        duration: job.config.duration / 1000,
        iterations: job.config.iterations,
        fight_type: job.config.fightType,
        mean_dps: transformed.stats.meanDps,
        min_dps: transformed.stats.minDps,
        max_dps: transformed.stats.maxDps,
        std_dev: transformed.stats.stdDev,
        timeline: transformed.timeline,
        charts: transformed.charts,
      });

      // Link job to result
      await SimulationRepository.updateJob(job.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        result_id: resultId,
      });

      job.resultId = resultId;
      job.status = "completed";
      job.completedAt = new Date();
    } catch (error) {
      await SimulationRepository.updateJob(job.id, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: (error as Error).message,
      });

      job.status = "failed";
      job.error = error as Error;
      job.completedAt = new Date();
    }
  },

  // Recover jobs on server restart
  async recoverJobs(): Promise<void> {
    const supabase = await createClient();
    const { data: runningJobs } = await supabase
      .from("simulation_jobs")
      .select("*")
      .in("status", ["queued", "running"]);

    if (!runningJobs) return;

    for (const dbJob of runningJobs) {
      // Mark as failed (server restarted)
      await SimulationRepository.updateJob(dbJob.id, {
        status: "failed",
        error_message: "Server restarted during execution",
        completed_at: new Date().toISOString(),
      });
    }
  },
};
```

### Step 3: Simulation History UI

```typescript
// apps/portal/src/app/simulate/history/page.tsx

import { Suspense } from "react";
import { SimulationHistory } from "@/components/simulate/simulation-history";
import { SimulationHistorySkeleton } from "@/components/simulate/simulation-history-skeleton";

export default function SimulationHistoryPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Simulation History</h1>
      <Suspense fallback={<SimulationHistorySkeleton />}>
        <SimulationHistory />
      </Suspense>
    </div>
  );
}
```

```typescript
// apps/portal/src/components/simulate/simulation-history.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

async function fetchHistory() {
  const response = await fetch("/api/simulations?limit=50");
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
}

export function SimulationHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["simulation-history"],
    queryFn: fetchHistory,
  });

  if (isLoading) return <SimulationHistorySkeleton />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rotation</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>DPS</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Iterations</TableHead>
          <TableHead>Date</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.results?.map((result: any) => (
          <TableRow key={result.id}>
            <TableCell className="font-medium">
              {result.rotation?.name ?? result.rotation_id}
            </TableCell>
            <TableCell>
              <StatusBadge status={result.status ?? "completed"} />
            </TableCell>
            <TableCell>
              {result.mean_dps
                ? Math.round(result.mean_dps).toLocaleString()
                : "-"}
            </TableCell>
            <TableCell>{result.duration}s</TableCell>
            <TableCell>{result.iterations.toLocaleString()}</TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(result.created_at), {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/simulate/results/${result.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    running: "secondary",
    queued: "outline",
    failed: "destructive",
    cancelled: "outline",
  };

  return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
}
```

---

## Rate Limiting

### API Rate Limits

```typescript
// apps/portal/src/lib/simulation/rate-limiter.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
});

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await ratelimit.limit(identifier);
  return result;
}
```

```typescript
// Apply in API route
export async function POST(request: NextRequest) {
  // Get user identifier (IP or user ID)
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";

  const { success, remaining, reset } = await checkRateLimit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: reset },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      },
    );
  }

  // ... continue with request
}
```

---

## Observability

### Logging

```typescript
// apps/portal/src/lib/simulation/logger.ts

import pino from "pino";

export const simLogger = pino({
  name: "simulation",
  level: process.env.LOG_LEVEL ?? "info",
});

// Usage in JobManager
simLogger.info(
  { jobId: job.id, rotationId: job.config.rotationId },
  "Starting simulation",
);
simLogger.info({ jobId: job.id, duration: elapsed }, "Simulation completed");
simLogger.error({ jobId: job.id, error: error.message }, "Simulation failed");
```

### Metrics

```typescript
// apps/portal/src/lib/simulation/metrics.ts

// Simple metrics counter (replace with Prometheus/Datadog in production)
const metrics = {
  simulationsStarted: 0,
  simulationsCompleted: 0,
  simulationsFailed: 0,
  totalIterations: 0,
  totalDuration: 0,
};

export function recordSimulationStart() {
  metrics.simulationsStarted++;
}

export function recordSimulationComplete(
  iterations: number,
  durationMs: number,
) {
  metrics.simulationsCompleted++;
  metrics.totalIterations += iterations;
  metrics.totalDuration += durationMs;
}

export function recordSimulationFailed() {
  metrics.simulationsFailed++;
}

export function getMetrics() {
  return {
    ...metrics,
    avgDurationMs: metrics.totalDuration / metrics.simulationsCompleted,
    avgIterations: metrics.totalIterations / metrics.simulationsCompleted,
    failureRate: metrics.simulationsFailed / metrics.simulationsStarted,
  };
}
```

---

## Error Recovery

### Retry Failed Jobs

```typescript
// apps/portal/src/lib/simulation/retry.ts

export async function retryJob(jobId: string): Promise<Job> {
  const originalJob = await SimulationRepository.getJob(jobId);

  if (!originalJob) {
    throw new Error("Job not found");
  }

  if (originalJob.status !== "failed") {
    throw new Error("Can only retry failed jobs");
  }

  // Create new job with same config
  return JobManager.create(
    {
      rotationId: originalJob.rotation_id,
      duration: originalJob.duration,
      iterations: originalJob.iterations,
      fightType: originalJob.fight_type,
      character: originalJob.character_data,
    },
    originalJob.user_id,
  );
}
```

### Graceful Shutdown

```typescript
// apps/portal/src/lib/simulation/shutdown.ts

let isShuttingDown = false;
const runningJobs = new Set<string>();

export function registerRunningJob(jobId: string) {
  runningJobs.add(jobId);
}

export function unregisterRunningJob(jobId: string) {
  runningJobs.delete(jobId);
}

export async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}, starting graceful shutdown...`);

  // Wait for running jobs to complete (max 30 seconds)
  const timeout = 30000;
  const start = Date.now();

  while (runningJobs.size > 0 && Date.now() - start < timeout) {
    console.log(`Waiting for ${runningJobs.size} jobs to complete...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (runningJobs.size > 0) {
    console.log(`Force stopping ${runningJobs.size} jobs`);
    for (const jobId of runningJobs) {
      await SimulationRepository.updateJob(jobId, {
        status: "failed",
        error_message: "Server shutdown",
        completed_at: new Date().toISOString(),
      });
    }
  }

  process.exit(0);
}

// Register handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

---

## UX Polish

### Toast Notifications

```typescript
// apps/portal/src/components/simulate/quick-sim-content.tsx

import { toast } from "sonner";

const handleRunSimulation = () => {
  startSimulation(params, {
    onSuccess: (data) => {
      toast.success("Simulation started", {
        description: `Job ${data.jobId} is running...`,
      });
      router.push(`/simulate/results/${data.jobId}`);
    },
    onError: (error) => {
      toast.error("Failed to start simulation", {
        description: error.message,
      });
    },
  });
};
```

### Cancel Confirmation

```typescript
// apps/portal/src/components/simulate/simulation-progress.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CancelButton({ jobId }: { jobId: string }) {
  const cancelMutation = useMutation({
    mutationFn: () => fetch(`/api/simulations/${jobId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.info("Simulation cancelled");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Cancel</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel simulation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop the simulation and discard partial results.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Running</AlertDialogCancel>
          <AlertDialogAction onClick={() => cancelMutation.mutate()}>
            Cancel Simulation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Loading States

Ensure all async operations have proper loading indicators using the pattern:

- `Component` → `ComponentInner` → `ComponentSkeleton`

---

## Migration Checklist

### Database

- [ ] Create `simulation_jobs` table migration
- [ ] Add indexes to existing `rotation_sim_results`
- [ ] Test RLS policies

### Backend

- [ ] Create `SimulationRepository`
- [ ] Update `JobManager` with persistence
- [ ] Add job recovery on startup
- [ ] Implement rate limiting
- [ ] Add logging/metrics
- [ ] Implement graceful shutdown

### Frontend

- [ ] Create simulation history page
- [ ] Add toast notifications
- [ ] Add cancel confirmation dialog
- [ ] Update results page to load from DB
- [ ] Add "View Previous" button on /simulate

### DevOps

- [ ] Set up Upstash Redis for rate limiting (if not already)
- [ ] Configure log aggregation
- [ ] Set up health check endpoint
- [ ] Add monitoring alerts

---

## Success Criteria

1. Simulation results persist across server restarts
2. Users can view their simulation history
3. Rate limiting prevents abuse
4. Jobs recover gracefully from server restarts
5. Proper loading states throughout the UI
6. Cancel confirmation prevents accidental cancellation

---

## Future Improvements

### Could Add Later

- Simulation comparison (diff two runs)
- Export results to CSV/JSON
- Share results via URL
- Simulation presets/templates
- Batch simulation from queue
- Priority queue for paying users

### Out of Scope

- Distributed workers (keep using standalone daemon)
- Real-time collaborative editing
- Mobile app

---

## Document Index

1. [Phase 0: Current State Analysis](./00-current-state.md)
2. [Phase 1: Runtime Extraction](./01-runtime-extraction.md)
3. [Phase 2: API Layer](./02-api-layer.md)
4. [Phase 3: Portal Wiring](./03-portal-wiring.md)
5. [Phase 4: Streaming & Progress](./04-streaming-progress.md)
6. **Phase 5: Persistence & Polish** (this document)
7. [User Flow Trace](./user-flow-trace.md)
