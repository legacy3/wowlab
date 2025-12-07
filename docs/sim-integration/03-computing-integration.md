# Phase 3: Computing Drawer Integration

> Wire simulation to the existing computing drawer. Show phases: "Preparing spells", "Booting engine", "Running simulation".

## What Already Exists

The portal has a computing drawer with job tracking:

```typescript
// apps/portal/src/atoms/computing/state.ts

export interface ComputingJob {
  id: string;
  name: string;
  status: "running" | "queued" | "completed" | "paused";
  progress: number;     // 0-100
  current: string;      // "1,672 / 2,496"
  eta: string;          // "8 minutes"
}

export const jobsAtom = atomWithStorage<ComputingJob[]>("computing-jobs", []);
export const toggleJobAtom = atom(...);  // Pause/resume
export const cancelJobAtom = atom(...);  // Cancel job
```

## What To Modify

Extend `ComputingJob` to support simulation phases.

## Step 1: Extend Job Interface

```typescript
// apps/portal/src/atoms/computing/state.ts

export type SimulationPhase =
  | "preparing-spells"
  | "booting-engine"
  | "running"
  | "uploading"
  | "completed"
  | "failed";

export interface ComputingJob {
  id: string;
  name: string;
  status: "running" | "queued" | "completed" | "paused" | "failed";
  progress: number;
  current: string;
  eta: string;

  // NEW: Simulation-specific fields
  phase?: SimulationPhase;
  phaseDetail?: string; // "Loading Kill Command (2/5)"
  rotationId?: string; // "beast-mastery"
  resultId?: string; // Supabase result ID when done
  error?: string; // Error message if failed
}

// Human-readable phase labels
export const PHASE_LABELS: Record<SimulationPhase, string> = {
  "preparing-spells": "Preparing spells",
  "booting-engine": "Booting simulation engine",
  running: "Running simulation",
  uploading: "Uploading results",
  completed: "Completed",
  failed: "Failed",
};
```

## Step 2: Create Simulation Job Atoms

```typescript
// apps/portal/src/atoms/simulation/job.ts

import { atom } from "jotai";
import { nanoid } from "nanoid";
import {
  jobsAtom,
  type ComputingJob,
  type SimulationPhase,
} from "@/atoms/computing/state";

export interface CreateSimJobParams {
  name: string;
  rotationId: string;
  totalIterations: number;
}

/**
 * Create a new simulation job and add to computing queue.
 */
export const createSimJobAtom = atom(
  null,
  (get, set, params: CreateSimJobParams): string => {
    const id = nanoid(12);
    const job: ComputingJob = {
      id,
      name: params.name,
      status: "running",
      progress: 0,
      current: `0 / ${params.totalIterations.toLocaleString()}`,
      eta: "Calculating...",
      phase: "preparing-spells",
      phaseDetail: "Loading spell data",
      rotationId: params.rotationId,
    };

    const jobs = get(jobsAtom);
    set(jobsAtom, [job, ...jobs]);

    return id;
  },
);

/**
 * Update simulation job phase.
 */
export const updateSimPhaseAtom = atom(
  null,
  (
    get,
    set,
    params: { jobId: string; phase: SimulationPhase; detail?: string },
  ) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              phase: params.phase,
              phaseDetail: params.detail,
            }
          : job,
      ),
    );
  },
);

/**
 * Update simulation job progress.
 */
export const updateSimProgressAtom = atom(
  null,
  (
    get,
    set,
    params: {
      jobId: string;
      current: number;
      total: number;
      eta?: string;
    },
  ) => {
    const jobs = get(jobsAtom);
    const progress = Math.round((params.current / params.total) * 100);

    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              progress,
              current: `${params.current.toLocaleString()} / ${params.total.toLocaleString()}`,
              eta: params.eta ?? job.eta,
            }
          : job,
      ),
    );
  },
);

/**
 * Mark simulation job as completed.
 */
export const completeSimJobAtom = atom(
  null,
  (get, set, params: { jobId: string; resultId?: string }) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              status: "completed" as const,
              progress: 100,
              phase: "completed" as const,
              phaseDetail: undefined,
              eta: "Completed",
              resultId: params.resultId,
            }
          : job,
      ),
    );
  },
);

/**
 * Mark simulation job as failed.
 */
export const failSimJobAtom = atom(
  null,
  (get, set, params: { jobId: string; error: string }) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              status: "failed" as const,
              phase: "failed" as const,
              phaseDetail: params.error,
              eta: "Failed",
              error: params.error,
            }
          : job,
      ),
    );
  },
);
```

## Step 3: Update Queue Card Display

```typescript
// apps/portal/src/components/layout/drawer/computing/cards/queue-card.tsx

import { PHASE_LABELS, type SimulationPhase } from "@/atoms/computing/state";

// In the job row component, show phase:
function JobRow({ job }: { job: ComputingJob }) {
  return (
    <div className="...">
      <div className="flex items-center justify-between">
        <span className="font-medium">{job.name}</span>
        {job.phase && (
          <Badge variant="outline" className="text-xs">
            {PHASE_LABELS[job.phase]}
          </Badge>
        )}
      </div>

      {/* Phase detail (e.g., "Loading Kill Command (2/5)") */}
      {job.phaseDetail && (
        <p className="text-xs text-muted-foreground">{job.phaseDetail}</p>
      )}

      <Progress value={job.progress} className="h-2" />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{job.current}</span>
        <span>{job.eta}</span>
      </div>
    </div>
  );
}
```

## Step 4: Test the Atoms

At this point, you can test the atoms work by manually creating a job:

```typescript
// In a test component or console:
import { useSetAtom } from "jotai";
import { createSimJobAtom, updateSimPhaseAtom } from "@/atoms/simulation/job";

function TestJobCreation() {
  const createJob = useSetAtom(createSimJobAtom);
  const updatePhase = useSetAtom(updateSimPhaseAtom);

  const handleTest = () => {
    const jobId = createJob({
      name: "Test Simulation",
      rotationId: "beast-mastery",
      totalIterations: 100,
    });

    // Simulate phase transitions
    setTimeout(() => updatePhase({ jobId, phase: "booting-engine", detail: "Loading runtime" }), 1000);
    setTimeout(() => updatePhase({ jobId, phase: "running", detail: "Executing" }), 2000);
  };

  return <button onClick={handleTest}>Create Test Job</button>;
}
```

**Note:** The full `useSimulation` hook that orchestrates everything is created in Phase 4.

## Checklist

- [ ] Extend `ComputingJob` interface with `phase`, `phaseDetail`, `rotationId`, `resultId`, `error`
- [ ] Add `SimulationPhase` type and `PHASE_LABELS` constant
- [ ] Create `atoms/simulation/job.ts` with job management atoms
- [ ] Update queue-card.tsx to display phase badges and details
- [ ] Test: Create job manually, verify it appears in computing drawer
- [ ] Test: Phase transitions update the badge correctly

## Phase Flow

```
1. Job created         → status: "running", phase: "preparing-spells"
2. Spells loading      → phaseDetail: "Loading spell 2/5"
3. Runtime init        → phase: "booting-engine"
4. Sim running         → phase: "running", progress: 0-100%
5. Done                → status: "completed", phase: "completed"
```

## Success Criteria

1. Starting simulation creates job in computing drawer
2. Phase badge shows current phase ("Preparing spells", etc.)
3. Progress bar updates during simulation
4. Completed jobs show "Completed" status
5. Failed jobs show error message

## Next Phase

→ [Phase 4: Results & Persistence](./04-results-persistence.md)
