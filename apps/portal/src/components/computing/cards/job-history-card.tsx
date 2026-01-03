"use client";

import { useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jobsAtom, cancelJobAtom, type SimulationJob } from "@/atoms/computing";
import { formatInt, formatCompact, formatDurationMs } from "@/lib/format";
import {
  JOB_STATUS_COLORS,
  JOB_STATUS_ICONS,
  JobStatusBadge,
} from "@/components/computing/job-status";

type JobStatus = SimulationJob["status"];

export function JobHistoryCard() {
  const jobs = useAtomValue(jobsAtom);
  const cancelJob = useSetAtom(cancelJobAtom);

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [selectedJob, setSelectedJob] = useState<SimulationJob | null>(null);

  const displayJobs = jobs;

  const filteredJobs = useMemo(() => {
    return displayJobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }
      if (filter) {
        const search = filter.toLowerCase();
        return job.name.toLowerCase().includes(search);
      }
      return true;
    });
  }, [displayJobs, filter, statusFilter]);

  const statuses: (JobStatus | "all")[] = [
    "all",
    "running",
    "queued",
    "completed",
    "failed",
  ];

  return (
    <>
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
                        : JOB_STATUS_COLORS[status]
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
            placeholder="Filter jobs ..."
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
                  <TableHead className="w-20 font-medium">Actions</TableHead>
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
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {job.result?.dps ? formatCompact(job.result.dps) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {job.result?.casts ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Cancel simulation"
                                disabled={
                                  job.status !== "running" &&
                                  job.status !== "queued"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelJob(job.id);
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel</TooltipContent>
                          </Tooltip>
                        </div>
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
              {selectedJob &&
                (() => {
                  if (selectedJob.status === "running") {
                    return (
                      <FlaskInlineLoader
                        className="h-4 w-4"
                        variant="processing"
                      />
                    );
                  }
                  const Icon = JOB_STATUS_ICONS[selectedJob.status];
                  return Icon ? <Icon className="h-4 w-4" /> : null;
                })()}
              {selectedJob?.name}
              {selectedJob && (
                <CopyButton
                  value={JSON.stringify(selectedJob, null, 2)}
                  label="Job details"
                  title="Copy job details"
                />
              )}
            </DialogTitle>
            <DialogDescription>Job ID: {selectedJob?.id}</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <JobStatusBadge status={selectedJob.status} />
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
                      {formatDurationMs(selectedJob.result.durationMs)}
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
    </>
  );
}
