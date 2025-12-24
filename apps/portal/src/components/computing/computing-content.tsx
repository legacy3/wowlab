"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Trash2,
  Activity,
  MemoryStick,
  Server,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/simulate/results/charts/chart-card";
import {
  jobsAtom,
  workerSystemAtom,
  cancelJobAtom,
  type SimulationJob,
} from "@/atoms/computing";
import { formatInt, formatCompact } from "@/lib/format";

// -----------------------------------------------------------------------------
// System Capabilities Hook
// -----------------------------------------------------------------------------

interface SystemCapabilities {
  cores: number;
  memory: number | null;
  workerPoolSize: number;
}

function useSystemCapabilities(): SystemCapabilities | null {
  const [caps, setCaps] = useState<SystemCapabilities | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cores = navigator.hardwareConcurrency || 4;
    setCaps({
      cores,
      memory:
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
        null,
      workerPoolSize: Math.max(2, Math.floor(cores / 2)),
    });
  }, []);

  return caps;
}

// -----------------------------------------------------------------------------
// Mock Data for Charts
// -----------------------------------------------------------------------------

const mockThroughputData = Array.from({ length: 30 }, (_, i) => ({
  time: i,
  itersPerSec: Math.floor(800 + Math.random() * 400 + Math.sin(i / 3) * 200),
  memoryMB: Math.floor(120 + Math.random() * 80 + i * 2 + Math.sin(i / 3) * 20),
}));

// Mock job history with details
const mockJobs: SimulationJob[] = [
  {
    id: "job-1",
    name: "Beast Mastery - ST Raid",
    status: "completed",
    progress: 100,
    current: "10,000 / 10,000",
    eta: "",
    phase: "completed",
    phaseDetail: "",
    rotationId: "bm-st-raid",
    resultId: "result-1",
    error: null,
    result: {
      dps: 52340,
      totalDamage: 3140400,
      durationMs: 60000,
      events: [],
      casts: 847,
    },
  },
  {
    id: "job-2",
    name: "Beast Mastery - M+ AoE",
    status: "failed",
    progress: 34,
    current: "3,400 / 10,000",
    eta: "",
    phase: "running",
    phaseDetail: "Running simulation",
    rotationId: "bm-aoe",
    resultId: null,
    error:
      "ReferenceError: BESTIAL_WRATH is not defined\n    at UserRotation (eval:15:12)\n    at runBatch (simulation-worker.ts:274:18)\n    at handleRequest (simulation-worker.ts:312:5)",
    result: null,
  },
  {
    id: "job-3",
    name: "Beast Mastery - Cleave",
    status: "completed",
    progress: 100,
    current: "10,000 / 10,000",
    eta: "",
    phase: "completed",
    phaseDetail: "",
    rotationId: "bm-cleave",
    resultId: "result-3",
    error: null,
    result: {
      dps: 48120,
      totalDamage: 2887200,
      durationMs: 60000,
      events: [],
      casts: 792,
    },
  },
  {
    id: "job-4",
    name: "Marksmanship - ST",
    status: "completed",
    progress: 100,
    current: "5,000 / 5,000",
    eta: "",
    phase: "completed",
    phaseDetail: "",
    rotationId: "mm-st",
    resultId: "result-4",
    error: null,
    result: {
      dps: 55780,
      totalDamage: 3346800,
      durationMs: 60000,
      events: [],
      casts: 623,
    },
  },
];

// -----------------------------------------------------------------------------
// Chart Configs
// -----------------------------------------------------------------------------

const throughputConfig = {
  itersPerSec: {
    label: "Iterations/sec",
    color: "var(--chart-1)",
  },
  memoryMB: {
    label: "Memory (MB)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// -----------------------------------------------------------------------------
// Charts
// -----------------------------------------------------------------------------

function ThroughputChart() {
  const data = mockThroughputData;

  const iters = data.map((d) => d.itersPerSec);
  const minIters = Math.min(...iters);
  const maxIters = Math.max(...iters);
  const avgIters = Math.round(iters.reduce((a, b) => a + b, 0) / iters.length);

  const mem = data.map((d) => d.memoryMB);
  const minMem = Math.min(...mem);
  const maxMem = Math.max(...mem);
  const avgMem = Math.round(mem.reduce((a, b) => a + b, 0) / mem.length);

  return (
    <ChartCard
      title="Worker Performance"
      description="Throughput and memory usage over time"
      chartConfig={throughputConfig}
      footer={
        <div className="flex gap-8 text-xs">
          <div className="space-y-0.5">
            <div className="text-muted-foreground">Iterations/sec</div>
            <div className="font-medium tabular-nums">
              {formatInt(minIters)} / {formatInt(avgIters)} /{" "}
              {formatInt(maxIters)}
              <span className="text-muted-foreground ml-1">(min/avg/max)</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-muted-foreground">Memory (MB)</div>
            <div className="font-medium tabular-nums">
              {formatInt(minMem)} / {formatInt(avgMem)} / {formatInt(maxMem)}
              <span className="text-muted-foreground ml-1">(min/avg/max)</span>
            </div>
          </div>
        </div>
      }
    >
      <ComposedChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `${v}s`}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatCompact}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `${formatInt(v)} MB`}
        />
        <ChartTooltip cursor={false} content={ChartTooltipContent} />
        <Area
          yAxisId="left"
          dataKey="itersPerSec"
          type="monotone"
          fill="var(--color-itersPerSec)"
          fillOpacity={0.2}
          stroke="var(--color-itersPerSec)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          dataKey="memoryMB"
          type="monotone"
          stroke="var(--color-memoryMB)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartCard>
  );
}

// -----------------------------------------------------------------------------
// Job Status Helpers
// -----------------------------------------------------------------------------

type JobStatus = SimulationJob["status"];

const STATUS_COLORS: Record<JobStatus, string> = {
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  queued: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const STATUS_ICONS: Record<JobStatus, React.ReactNode> = {
  running: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  queued: <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  failed: <XCircle className="h-3.5 w-3.5" />,
  paused: <Clock className="h-3.5 w-3.5" />,
};

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

export function ComputingContent() {
  const system = useAtomValue(workerSystemAtom);
  const jobs = useAtomValue(jobsAtom);
  const cancelJob = useSetAtom(cancelJobAtom);
  const caps = useSystemCapabilities();

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [selectedJob, setSelectedJob] = useState<SimulationJob | null>(null);

  // Use mock jobs for UI development
  const displayJobs = mockJobs;

  const filteredJobs = useMemo(() => {
    return displayJobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (filter) {
        const search = filter.toLowerCase();
        return job.name.toLowerCase().includes(search);
      }
      return true;
    });
  }, [displayJobs, filter, statusFilter]);

  const activeJobs = jobs.filter(
    (j) => j.status === "running" || j.status === "queued",
  );
  const lastError = jobs.find((j) => j.status === "failed")?.error;

  // MOCK DATA - hardcoded for UI development
  const runningJob = {
    progress: 67,
    eta: "~12s",
    current: "6,700 / 10,000",
  };

  const statuses: (JobStatus | "all")[] = [
    "all",
    "running",
    "queued",
    "completed",
    "failed",
  ];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            Computing Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Worker v{system.workerVersion ?? "—"} · {system.totalSimulationsRun}{" "}
            simulations · {formatInt(system.totalIterationsRun)} iterations
          </p>
        </div>
        {activeJobs.length > 0 && (
          <Badge className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {activeJobs.length} running
          </Badge>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Cpu className="h-3.5 w-3.5" />
            CPU Cores
          </div>
          <p className="text-2xl font-bold mt-1">{caps?.cores ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <MemoryStick className="h-3.5 w-3.5" />
            Memory
          </div>
          <p className="text-2xl font-bold mt-1">
            {caps?.memory ? `${caps.memory} GB` : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Server className="h-3.5 w-3.5" />
            Workers
          </div>
          <p className="text-2xl font-bold mt-1">
            {caps?.workerPoolSize ?? "—"}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Activity className="h-3.5 w-3.5" />
            Simulations
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {system.totalSimulationsRun}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              {runningJob ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              Iterations
            </div>
            {runningJob && (
              <span className="text-muted-foreground">{runningJob.eta}</span>
            )}
          </div>
          {runningJob ? (
            <div className="mt-1 space-y-1.5">
              <p className="text-lg font-bold tabular-nums">
                {runningJob.current}
              </p>
              <Progress value={runningJob.progress} className="h-1.5" />
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {formatCompact(system.totalIterationsRun)}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {lastError ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
            Status
          </div>
          <p className="text-2xl font-bold mt-1">
            {lastError ? "Error" : "OK"}
          </p>
        </Card>
      </div>

      {/* Chart */}
      <ThroughputChart />

      {/* Jobs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">
              Simulation History
              <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                ({formatInt(filteredJobs.length)} jobs)
              </span>
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    statusFilter === status
                      ? status === "all"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : STATUS_COLORS[status]
                      : "hover:bg-muted/60"
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Input
            placeholder="Filter jobs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <div className="max-h-[400px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] font-medium">
                    Status
                  </TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="w-[120px] font-medium">DPS</TableHead>
                  <TableHead className="w-[100px] font-medium">Casts</TableHead>
                  <TableHead className="w-[80px] font-medium"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {jobs.length === 0
                        ? "No simulations yet"
                        : "No jobs match the current filter"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="group cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[job.status]}
                        >
                          {STATUS_ICONS[job.status]}
                          <span className="ml-1">{job.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {job.result?.dps
                          ? `${(job.result.dps / 1000).toFixed(1)}k`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {job.result?.casts ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(job.status === "running" ||
                          job.status === "queued") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelJob(job.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Modal */}
      <Dialog
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedJob && STATUS_ICONS[selectedJob.status]}
              {selectedJob?.name}
            </DialogTitle>
            <DialogDescription>Job ID: {selectedJob?.id}</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[selectedJob.status]}
                >
                  {selectedJob.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedJob.current}
                </span>
              </div>

              {/* Results */}
              {selectedJob.result && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div>
                    <div className="text-xs text-muted-foreground">DPS</div>
                    <div className="text-lg font-bold tabular-nums">
                      {formatInt(selectedJob.result.dps)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Casts</div>
                    <div className="text-lg font-bold tabular-nums">
                      {formatInt(selectedJob.result.casts)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Damage
                    </div>
                    <div className="text-lg font-bold tabular-nums">
                      {formatCompact(selectedJob.result.totalDamage)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Duration
                    </div>
                    <div className="text-lg font-bold tabular-nums">
                      {(selectedJob.result.durationMs / 1000).toFixed(0)}s
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedJob.error && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-500">Error</div>
                  <pre className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-xs text-red-400 overflow-x-auto whitespace-pre-wrap font-mono">
                    {selectedJob.error}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Rotation ID: {selectedJob.rotationId}</div>
                {selectedJob.resultId && (
                  <div>Result ID: {selectedJob.resultId}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
