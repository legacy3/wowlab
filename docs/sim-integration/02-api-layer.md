# Phase 2: API Layer

> Create Next.js API routes to run simulations server-side

## Goal

Build a REST API in `apps/portal` that exposes simulation capabilities to the frontend. The API will handle job lifecycle (create, status, cancel) and results retrieval.

---

## API Design

### Endpoints

| Method | Endpoint                       | Purpose                           |
| ------ | ------------------------------ | --------------------------------- |
| POST   | `/api/simulations`             | Start a new simulation job        |
| GET    | `/api/simulations/[id]`        | Get job status and results        |
| GET    | `/api/simulations/[id]/stream` | SSE stream for progress (Phase 4) |
| DELETE | `/api/simulations/[id]`        | Cancel a running job              |
| GET    | `/api/simulations`             | List recent jobs (optional)       |

### Request/Response Schemas

```typescript
// POST /api/simulations
interface CreateSimulationRequest {
  rotationId: string; // "beast-mastery" or UUID from DB
  duration: number; // Seconds (30-900)
  iterations: number; // 1-50000
  fightType: "patchwerk" | "movement" | "aoe";
  // Optional: character data from SimC export
  character?: {
    name: string;
    class: string;
    spec: string;
    level: number;
    itemLevel: number;
  };
}

interface CreateSimulationResponse {
  jobId: string;
  status: "queued" | "running";
  createdAt: string;
}

// GET /api/simulations/[id]
interface SimulationStatus {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface SimulationResults {
  jobId: string;
  status: "completed";
  stats: {
    meanDps: number;
    minDps: number;
    maxDps: number;
    stdDev: number;
    iterations: number;
    duration: number;
  };
  timeline: TimelineData; // For Konva viz
  charts: ChartData; // For Recharts
  completedAt: string;
}
```

---

## Directory Structure

```
apps/portal/src/
├── app/
│   └── api/
│       └── simulations/
│           ├── route.ts              # POST: create, GET: list
│           └── [id]/
│               ├── route.ts          # GET: status/results, DELETE: cancel
│               └── stream/
│                   └── route.ts      # GET: SSE stream (Phase 4)
├── lib/
│   └── simulation/
│       ├── index.ts                  # Re-exports
│       ├── job-manager.ts            # Job lifecycle management
│       ├── result-transformer.ts     # Convert sim output → UI format
│       └── types.ts                  # API types
```

---

## Implementation

### Job Manager

Manages simulation jobs with in-memory state (Phase 5 adds persistence):

```typescript
// apps/portal/src/lib/simulation/job-manager.ts

import { Effect, Fiber, FiberHandle } from "effect";
import {
  createSimulationRuntime,
  loadSpells,
  getRotation,
  runSimulation,
} from "@wowlab/sim-engine";
import { nanoid } from "nanoid";

interface Job {
  id: string;
  status: JobStatus;
  config: SimulationConfig;
  fiber?: FiberHandle<SimulationResult, SimulationError>;
  result?: SimulationResult;
  error?: Error;
  progress: { current: number; total: number };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

// In-memory job store (single instance)
const jobs = new Map<string, Job>();

export const JobManager = {
  async create(config: CreateSimulationRequest): Promise<Job> {
    const id = nanoid(12);
    const job: Job = {
      id,
      status: "queued",
      config: {
        rotationId: config.rotationId,
        duration: config.duration * 1000, // Convert to ms
        iterations: config.iterations,
        fightType: config.fightType,
      },
      progress: { current: 0, total: config.iterations },
      createdAt: new Date(),
    };

    jobs.set(id, job);

    // Start execution asynchronously
    this.execute(job);

    return job;
  },

  async execute(job: Job): Promise<void> {
    job.status = "running";
    job.startedAt = new Date();

    try {
      // Get rotation definition
      const rotation = getRotation(job.config.rotationId);
      if (!rotation) {
        throw new Error(`Rotation not found: ${job.config.rotationId}`);
      }

      // Load spell data
      const spells = await Effect.runPromise(loadSpells(rotation.spellIds));

      // Create runtime
      const runtime = createSimulationRuntime({ spells, logLevel: "none" });

      // Run simulation(s)
      if (job.config.iterations === 1) {
        // Single sim with full timeline
        const result = await runSimulation(runtime, {
          simId: 1,
          duration: job.config.duration,
          rotation,
        });
        job.result = result;
      } else {
        // Batch execution
        const result = await runBatch(runtime, {
          iterations: job.config.iterations,
          duration: job.config.duration,
          rotation,
          onProgress: (current, total) => {
            job.progress = { current, total };
          },
        });
        job.result = result;
      }

      job.status = "completed";
      job.completedAt = new Date();
    } catch (error) {
      job.status = "failed";
      job.error = error as Error;
      job.completedAt = new Date();
    }
  },

  get(id: string): Job | undefined {
    return jobs.get(id);
  },

  cancel(id: string): boolean {
    const job = jobs.get(id);
    if (!job || job.status !== "running") return false;

    if (job.fiber) {
      // Interrupt the Effect fiber
      Effect.runFork(Fiber.interrupt(job.fiber));
    }

    job.status = "cancelled";
    job.completedAt = new Date();
    return true;
  },

  list(limit = 10): Job[] {
    return Array.from(jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },

  // Cleanup old jobs (call periodically)
  cleanup(maxAge: number = 3600000): void {
    const cutoff = Date.now() - maxAge;
    for (const [id, job] of jobs) {
      if (job.completedAt && job.completedAt.getTime() < cutoff) {
        jobs.delete(id);
      }
    }
  },
};
```

### API Routes

**Create/List Simulations:**

```typescript
// apps/portal/src/app/api/simulations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { JobManager } from "@/lib/simulation/job-manager";
import { z } from "zod";

const CreateSimulationSchema = z.object({
  rotationId: z.string(),
  duration: z.number().min(30).max(900),
  iterations: z.number().min(1).max(50000),
  fightType: z.enum(["patchwerk", "movement", "aoe"]),
  character: z
    .object({
      name: z.string(),
      class: z.string(),
      spec: z.string(),
      level: z.number(),
      itemLevel: z.number(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = CreateSimulationSchema.parse(body);

    const job = await JobManager.create(config);

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const jobs = JobManager.list(limit);

  return NextResponse.json({
    jobs: jobs.map((job) => ({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    })),
  });
}
```

**Get/Cancel Simulation:**

```typescript
// apps/portal/src/app/api/simulations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { JobManager } from "@/lib/simulation/job-manager";
import { transformResults } from "@/lib/simulation/result-transformer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const job = JobManager.get(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Base response with status
  const response: any = {
    jobId: job.id,
    status: job.status,
    progress: {
      current: job.progress.current,
      total: job.progress.total,
      percentage: Math.round((job.progress.current / job.progress.total) * 100),
    },
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  };

  // Add results if completed
  if (job.status === "completed" && job.result) {
    const transformed = transformResults(job.result);
    response.stats = transformed.stats;
    response.timeline = transformed.timeline;
    response.charts = transformed.charts;
  }

  // Add error if failed
  if (job.status === "failed" && job.error) {
    response.error = job.error.message;
  }

  return NextResponse.json(response);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const cancelled = JobManager.cancel(id);

  if (!cancelled) {
    return NextResponse.json(
      { error: "Job not found or not cancellable" },
      { status: 400 },
    );
  }

  return NextResponse.json({ status: "cancelled" });
}
```

### Result Transformer

Converts simulation output to portal's timeline/chart format:

```typescript
// apps/portal/src/lib/simulation/result-transformer.ts

import type { SimulationResult } from "@wowlab/sim-engine";
import type { TimelineData, ChartData } from "@/atoms/timeline/state";

export interface TransformedResults {
  stats: {
    meanDps: number;
    minDps: number;
    maxDps: number;
    stdDev: number;
    iterations: number;
    duration: number;
  };
  timeline: TimelineData;
  charts: ChartData;
}

export function transformResults(result: SimulationResult): TransformedResults {
  // Calculate DPS stats
  const stats = calculateStats(result);

  // Transform events to timeline format
  const timeline = transformTimeline(result.events);

  // Aggregate data for charts
  const charts = transformCharts(result.events, result.duration);

  return { stats, timeline, charts };
}

function calculateStats(result: SimulationResult) {
  // For single sim, calculate from events
  // For batch, aggregate from results array
  const totalDamage = result.events
    .filter((e) => e.type === "SPELL_DAMAGE")
    .reduce((sum, e) => sum + e.amount, 0);

  const dps = totalDamage / (result.duration / 1000);

  return {
    meanDps: dps,
    minDps: dps, // Single sim
    maxDps: dps,
    stdDev: 0,
    iterations: 1,
    duration: result.duration / 1000,
  };
}

function transformTimeline(events: SimulationEvent[]): TimelineData {
  return {
    casts: events
      .filter((e) => e.type === "SPELL_CAST_SUCCESS")
      .map((e) => ({
        id: e.id,
        spellId: e.spellId,
        spellName: e.spellName,
        timestamp: e.timestamp,
        castTime: e.castTime ?? 0,
        isInstant: !e.castTime,
      })),
    buffs: events
      .filter((e) => e.type === "SPELL_AURA_APPLIED" && !e.isDebuff)
      .map((e) => ({
        id: e.id,
        spellId: e.spellId,
        spellName: e.spellName,
        startTime: e.timestamp,
        endTime: e.endTime,
        stacks: e.stacks ?? 1,
      })),
    debuffs: events
      .filter((e) => e.type === "SPELL_AURA_APPLIED" && e.isDebuff)
      .map((e) => ({
        id: e.id,
        spellId: e.spellId,
        spellName: e.spellName,
        startTime: e.timestamp,
        endTime: e.endTime,
        stacks: e.stacks ?? 1,
      })),
    damage: events
      .filter((e) => e.type === "SPELL_DAMAGE")
      .map((e) => ({
        id: e.id,
        spellId: e.spellId,
        spellName: e.spellName,
        timestamp: e.timestamp,
        amount: e.amount,
        isCrit: e.isCrit ?? false,
      })),
    resources: [], // Populated if resource events exist
  };
}

function transformCharts(
  events: SimulationEvent[],
  duration: number,
): ChartData {
  // DPS over time (1-second buckets)
  const dpsOverTime = calculateDpsOverTime(events, duration);

  // Ability breakdown
  const abilityBreakdown = calculateAbilityBreakdown(events);

  // Resource usage over time
  const resourceUsage = calculateResourceUsage(events, duration);

  return {
    dps: dpsOverTime,
    abilities: abilityBreakdown,
    resources: resourceUsage,
    cooldowns: [], // Extract cooldown usage
  };
}

function calculateDpsOverTime(events: SimulationEvent[], duration: number) {
  const bucketSize = 1000; // 1 second
  const buckets: number[] = new Array(Math.ceil(duration / bucketSize)).fill(0);

  events
    .filter((e) => e.type === "SPELL_DAMAGE")
    .forEach((e) => {
      const bucket = Math.floor(e.timestamp / bucketSize);
      if (bucket < buckets.length) {
        buckets[bucket] += e.amount;
      }
    });

  return buckets.map((damage, i) => ({
    time: i,
    dps: damage,
    runningAvg: calculateRunningAverage(buckets, i),
  }));
}

function calculateAbilityBreakdown(events: SimulationEvent[]) {
  const bySpell = new Map<
    number,
    { name: string; damage: number; casts: number }
  >();

  events
    .filter((e) => e.type === "SPELL_DAMAGE")
    .forEach((e) => {
      const existing = bySpell.get(e.spellId) ?? {
        name: e.spellName,
        damage: 0,
        casts: 0,
      };
      existing.damage += e.amount;
      existing.casts++;
      bySpell.set(e.spellId, existing);
    });

  return Array.from(bySpell.entries()).map(([spellId, data]) => ({
    spellId,
    spellName: data.name,
    totalDamage: data.damage,
    casts: data.casts,
    avgDamage: data.damage / data.casts,
  }));
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Simulation config (new)
SIM_MAX_ITERATIONS=50000
SIM_MAX_DURATION=900
SIM_JOB_TIMEOUT=600000  # 10 minutes
```

---

## Error Handling

```typescript
// apps/portal/src/lib/simulation/errors.ts

export class SimulationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "SimulationError";
  }
}

export const SimulationErrors = {
  ROTATION_NOT_FOUND: (id: string) =>
    new SimulationError(`Rotation not found: ${id}`, "ROTATION_NOT_FOUND", 404),

  JOB_NOT_FOUND: (id: string) =>
    new SimulationError(`Job not found: ${id}`, "JOB_NOT_FOUND", 404),

  INVALID_CONFIG: (details: string) =>
    new SimulationError(
      `Invalid configuration: ${details}`,
      "INVALID_CONFIG",
      400,
    ),

  EXECUTION_FAILED: (cause: unknown) =>
    new SimulationError(
      `Simulation execution failed: ${cause}`,
      "EXECUTION_FAILED",
      500,
    ),

  TIMEOUT: () => new SimulationError("Simulation timed out", "TIMEOUT", 408),
};
```

---

## Testing the API

```bash
# Create a simulation
curl -X POST http://localhost:3000/api/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "rotationId": "beast-mastery",
    "duration": 60,
    "iterations": 1,
    "fightType": "patchwerk"
  }'

# Response: { "jobId": "abc123xyz", "status": "running", "createdAt": "..." }

# Check status
curl http://localhost:3000/api/simulations/abc123xyz

# Response: { "jobId": "abc123xyz", "status": "completed", "stats": {...}, "timeline": {...} }

# Cancel (if still running)
curl -X DELETE http://localhost:3000/api/simulations/abc123xyz
```

---

## Migration Checklist

- [ ] Create `app/api/simulations/route.ts`
- [ ] Create `app/api/simulations/[id]/route.ts`
- [ ] Create `lib/simulation/job-manager.ts`
- [ ] Create `lib/simulation/result-transformer.ts`
- [ ] Create `lib/simulation/types.ts`
- [ ] Create `lib/simulation/errors.ts`
- [ ] Add Zod schemas for request validation
- [ ] Add environment variables
- [ ] Test with curl/Postman
- [ ] Verify standalone still works

---

## Success Criteria

1. `POST /api/simulations` creates a job and returns jobId
2. `GET /api/simulations/[id]` returns job status
3. Completed jobs include transformed timeline/chart data
4. Jobs can be cancelled mid-execution
5. Error responses are consistent and helpful

---

## Next Steps

→ [Phase 3: Portal Wiring](./03-portal-wiring.md)
