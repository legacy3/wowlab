# Phase 4: Streaming & Progress

> Real-time progress updates via Server-Sent Events (SSE)

## Goal

Replace polling with SSE streaming for real-time simulation progress updates, enabling:

- Live iteration count updates
- Running DPS calculations
- Smooth progress bar animations
- Partial results preview

---

## Architecture

```
Client                          Server (Next.js)
──────────────────────────────────────────────────────────────

Browser
  └─→ EventSource("/api/simulations/[id]/stream")
      ←── SSE: { type: "progress", current: 100, total: 1000 }
      ←── SSE: { type: "progress", current: 200, total: 1000 }
      ←── SSE: { type: "partial", stats: { meanDps: 45000 } }
      ←── SSE: { type: "progress", current: 1000, total: 1000 }
      ←── SSE: { type: "complete", stats: {...}, timeline: {...} }
      └─→ Close connection
```

---

## SSE Event Types

```typescript
// Event type definitions
type SSEEvent =
  | { type: "connected"; jobId: string }
  | { type: "progress"; current: number; total: number; percentage: number }
  | { type: "partial"; stats: Partial<SimulationStats> }
  | {
      type: "complete";
      stats: SimulationStats;
      timeline: TimelineData;
      charts: ChartData;
    }
  | { type: "error"; message: string; code: string }
  | { type: "cancelled" };
```

---

## Server Implementation

### Step 1: SSE Stream Route

```typescript
// apps/portal/src/app/api/simulations/[id]/stream/route.ts

import { NextRequest } from "next/server";
import { JobManager } from "@/lib/simulation/job-manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = JobManager.get(id);

  if (!job) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ type: "error", message: "Job not found", code: "NOT_FOUND" })}\n\n`,
      {
        status: 404,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connected event
      const sendEvent = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
          ),
        );
      };

      sendEvent({ type: "connected", jobId: id });

      // If already completed, send final result immediately
      if (job.status === "completed") {
        sendEvent({
          type: "complete",
          stats: job.transformedResult!.stats,
          timeline: job.transformedResult!.timeline,
          charts: job.transformedResult!.charts,
        });
        controller.close();
        return;
      }

      if (job.status === "failed") {
        sendEvent({
          type: "error",
          message: job.error!.message,
          code: "FAILED",
        });
        controller.close();
        return;
      }

      if (job.status === "cancelled") {
        sendEvent({ type: "cancelled" });
        controller.close();
        return;
      }

      // Subscribe to job updates
      const unsubscribe = JobManager.subscribe(id, (update) => {
        switch (update.type) {
          case "progress":
            sendEvent({
              type: "progress",
              current: update.current,
              total: update.total,
              percentage: Math.round((update.current / update.total) * 100),
            });
            break;

          case "partial":
            sendEvent({
              type: "partial",
              stats: update.stats,
            });
            break;

          case "complete":
            sendEvent({
              type: "complete",
              stats: update.stats,
              timeline: update.timeline,
              charts: update.charts,
            });
            controller.close();
            break;

          case "error":
            sendEvent({
              type: "error",
              message: update.message,
              code: update.code,
            });
            controller.close();
            break;

          case "cancelled":
            sendEvent({ type: "cancelled" });
            controller.close();
            break;
        }
      });

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
```

### Step 2: Update Job Manager with Pub/Sub

```typescript
// apps/portal/src/lib/simulation/job-manager.ts

type JobUpdate =
  | { type: "progress"; current: number; total: number }
  | { type: "partial"; stats: Partial<SimulationStats> }
  | {
      type: "complete";
      stats: SimulationStats;
      timeline: TimelineData;
      charts: ChartData;
    }
  | { type: "error"; message: string; code: string }
  | { type: "cancelled" };

type UpdateHandler = (update: JobUpdate) => void;

// Subscribers per job
const subscribers = new Map<string, Set<UpdateHandler>>();

export const JobManager = {
  // ... existing methods ...

  subscribe(jobId: string, handler: UpdateHandler): () => void {
    if (!subscribers.has(jobId)) {
      subscribers.set(jobId, new Set());
    }
    subscribers.get(jobId)!.add(handler);

    return () => {
      subscribers.get(jobId)?.delete(handler);
      if (subscribers.get(jobId)?.size === 0) {
        subscribers.delete(jobId);
      }
    };
  },

  notify(jobId: string, update: JobUpdate): void {
    subscribers.get(jobId)?.forEach((handler) => {
      try {
        handler(update);
      } catch (e) {
        console.error("Error in job subscriber:", e);
      }
    });
  },

  async execute(job: Job): Promise<void> {
    job.status = "running";
    job.startedAt = new Date();

    try {
      const rotation = getRotation(job.config.rotationId);
      if (!rotation)
        throw new Error(`Rotation not found: ${job.config.rotationId}`);

      const spells = await Effect.runPromise(loadSpells(rotation.spellIds));
      const runtime = createSimulationRuntime({ spells, logLevel: "none" });

      // Progress callback for batch execution
      const onProgress = (
        current: number,
        total: number,
        partialStats?: Partial<SimulationStats>,
      ) => {
        job.progress = { current, total };
        this.notify(job.id, { type: "progress", current, total });

        // Send partial stats every 10%
        if (partialStats && current % Math.floor(total / 10) === 0) {
          this.notify(job.id, { type: "partial", stats: partialStats });
        }
      };

      const result = await runBatch(runtime, {
        iterations: job.config.iterations,
        duration: job.config.duration,
        rotation,
        onProgress,
      });

      const transformed = transformResults(result);
      job.result = result;
      job.transformedResult = transformed;
      job.status = "completed";
      job.completedAt = new Date();

      this.notify(job.id, {
        type: "complete",
        stats: transformed.stats,
        timeline: transformed.timeline,
        charts: transformed.charts,
      });
    } catch (error) {
      job.status = "failed";
      job.error = error as Error;
      job.completedAt = new Date();

      this.notify(job.id, {
        type: "error",
        message: (error as Error).message,
        code: "EXECUTION_FAILED",
      });
    }
  },

  cancel(id: string): boolean {
    const job = jobs.get(id);
    if (!job || job.status !== "running") return false;

    if (job.fiber) {
      Effect.runFork(Fiber.interrupt(job.fiber));
    }

    job.status = "cancelled";
    job.completedAt = new Date();

    this.notify(id, { type: "cancelled" });

    return true;
  },
};
```

---

## Client Implementation

### Step 1: SSE Hook

```typescript
// apps/portal/src/hooks/simulation/use-simulation-stream.ts

import { useEffect, useState, useCallback } from "react";

interface StreamState {
  status: "connecting" | "connected" | "complete" | "error" | "cancelled";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  partialStats?: Partial<SimulationStats>;
  result?: {
    stats: SimulationStats;
    timeline: TimelineData;
    charts: ChartData;
  };
  error?: string;
}

export function useSimulationStream(jobId: string) {
  const [state, setState] = useState<StreamState>({ status: "connecting" });

  useEffect(() => {
    const eventSource = new EventSource(`/api/simulations/${jobId}/stream`);

    eventSource.addEventListener("connected", (e) => {
      setState((prev) => ({ ...prev, status: "connected" }));
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        progress: {
          current: data.current,
          total: data.total,
          percentage: data.percentage,
        },
      }));
    });

    eventSource.addEventListener("partial", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        partialStats: data.stats,
      }));
    });

    eventSource.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data);
      setState({
        status: "complete",
        result: {
          stats: data.stats,
          timeline: data.timeline,
          charts: data.charts,
        },
      });
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      const data = JSON.parse(e.data);
      setState({
        status: "error",
        error: data.message,
      });
      eventSource.close();
    });

    eventSource.addEventListener("cancelled", () => {
      setState({ status: "cancelled" });
      eventSource.close();
    });

    // Handle connection errors
    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Connection lost",
        }));
      }
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return state;
}
```

### Step 2: Update SimulationResults Component

```typescript
// apps/portal/src/components/simulate/simulation-results.tsx

"use client";

import { useSimulationStream } from "@/hooks/simulation/use-simulation-stream";
import { SimulationProgress } from "./simulation-progress";
import { SimulationResultTabs } from "./simulation-result-tabs";
import { SimulationError } from "./simulation-error";

interface Props {
  jobId: string;
}

export function SimulationResults({ jobId }: Props) {
  const stream = useSimulationStream(jobId);

  // Connecting
  if (stream.status === "connecting") {
    return <SimulationProgress status="connecting" />;
  }

  // Error
  if (stream.status === "error") {
    return <SimulationError message={stream.error ?? "Unknown error"} />;
  }

  // Cancelled
  if (stream.status === "cancelled") {
    return <SimulationError message="Simulation was cancelled" />;
  }

  // Running with progress
  if (stream.status === "connected" && stream.progress) {
    return (
      <SimulationProgress
        status="running"
        progress={stream.progress}
        partialStats={stream.partialStats}
      />
    );
  }

  // Completed
  if (stream.status === "complete" && stream.result) {
    return (
      <SimulationResultTabs
        stats={stream.result.stats}
        timeline={stream.result.timeline}
        charts={stream.result.charts}
      />
    );
  }

  // Fallback
  return <SimulationProgress status="queued" />;
}
```

### Step 3: Enhanced Progress Component

Show partial results while running:

```typescript
// apps/portal/src/components/simulate/simulation-progress.tsx

"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Props {
  status: "connecting" | "queued" | "running";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  partialStats?: Partial<SimulationStats>;
}

export function SimulationProgress({ status, progress, partialStats }: Props) {
  return (
    <div className="space-y-6">
      {/* Main progress card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {status === "connecting" && "Connecting..."}
            {status === "queued" && "Queued"}
            {status === "running" && "Running Simulation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress && (
            <>
              <Progress value={progress.percentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {progress.current.toLocaleString()} / {progress.total.toLocaleString()} iterations
                </span>
                <span>{progress.percentage}%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Partial stats preview */}
      {partialStats && (
        <div className="grid grid-cols-3 gap-4">
          {partialStats.meanDps && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Running Avg DPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(partialStats.meanDps).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
          {partialStats.minDps && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Min DPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(partialStats.minDps).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
          {partialStats.maxDps && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Max DPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(partialStats.maxDps).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Heartbeat & Reconnection

Add heartbeat to keep connection alive and handle reconnection:

```typescript
// Server: Add heartbeat every 30 seconds
const heartbeatInterval = setInterval(() => {
  controller.enqueue(encoder.encode(": heartbeat\n\n"));
}, 30000);

request.signal.addEventListener("abort", () => {
  clearInterval(heartbeatInterval);
  unsubscribe();
  controller.close();
});
```

```typescript
// Client: Reconnection logic
export function useSimulationStream(jobId: string) {
  const [state, setState] = useState<StreamState>({ status: "connecting" });
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(`/api/simulations/${jobId}/stream`);

      eventSource.onopen = () => {
        reconnectAttempts.current = 0;
      };

      // ... event handlers ...

      eventSource.onerror = () => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            setTimeout(connect, 1000 * reconnectAttempts.current);
          } else {
            setState((prev) => ({
              ...prev,
              status: "error",
              error: "Connection lost after multiple attempts",
            }));
          }
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [jobId]);

  return state;
}
```

---

## Migration Checklist

- [ ] Create SSE stream route at `/api/simulations/[id]/stream/route.ts`
- [ ] Add pub/sub to JobManager
- [ ] Update `runBatch` to accept `onProgress` callback
- [ ] Create `useSimulationStream` hook
- [ ] Update `SimulationResults` to use streaming
- [ ] Update `SimulationProgress` to show partial stats
- [ ] Add heartbeat and reconnection logic
- [ ] Test streaming with slow network (throttle in DevTools)
- [ ] Verify cleanup on client disconnect

---

## Success Criteria

1. Progress bar updates in real-time (not via polling)
2. Partial DPS stats shown during execution
3. Final results delivered via SSE, not separate fetch
4. Connection recovers from temporary drops
5. No memory leaks (proper cleanup)

---

## Performance Considerations

### Server

- Limit concurrent SSE connections per client/IP
- Set reasonable timeouts (10 minutes max)
- Clean up subscriptions on job completion

### Client

- Single EventSource per job
- Debounce progress updates if too frequent
- Batch state updates to reduce renders

---

## Next Steps

→ [Phase 5: Persistence & Polish](./05-persistence-polish.md)
