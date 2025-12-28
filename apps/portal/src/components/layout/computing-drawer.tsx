"use client";

import { useAtom, useSetAtom } from "jotai";
import { atom } from "jotai";
import Link from "next/link";
import { Cpu, X } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  jobsAtom,
  cancelJobAtom,
  PHASE_LABELS,
  type SimulationJob,
} from "@/atoms/computing";
import { cancelSimulation } from "@/hooks/rotations";
import {
  JOB_STATUS_COLORS,
  JOB_STATUS_ICONS,
} from "@/components/computing/job-status";

// Drawer open state - can be controlled from anywhere
export const computingDrawerOpenAtom = atom(false);

function JobCard({
  job,
  onClose,
}: {
  job: SimulationJob;
  onClose: () => void;
}) {
  const cancelJob = useSetAtom(cancelJobAtom);

  const StatusIcon = JOB_STATUS_ICONS[job.status];
  const statusTextClass =
    JOB_STATUS_COLORS[job.status]
      .split(" ")
      .find((cls) => cls.startsWith("text-")) ?? "text-muted-foreground";

  return (
    <div className="rounded-xl border bg-card/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {job.status === "running" ? (
            <FlaskInlineLoader
              className={`h-5 w-5 ${statusTextClass}`}
              variant="processing"
            />
          ) : StatusIcon ? (
            <StatusIcon className={`h-5 w-5 ${statusTextClass}`} />
          ) : null}
          <span className="font-medium">{job.name}</span>
        </div>
        {(job.status === "running" || job.status === "queued") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 -mr-1"
            onClick={() => {
              cancelSimulation(job.id);
              cancelJob(job.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{PHASE_LABELS[job.phase]}</Badge>
          {job.status !== "completed" && job.status !== "failed" && (
            <span className="text-sm text-muted-foreground">{job.eta}</span>
          )}
        </div>
        {job.status !== "completed" && job.phaseDetail && (
          <p className="text-sm text-muted-foreground">{job.phaseDetail}</p>
        )}
      </div>

      {job.status !== "completed" && job.status !== "failed" && (
        <div className="space-y-2">
          <Progress value={job.progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{job.progress}%</span>
            <span>{job.current}</span>
          </div>
        </div>
      )}

      {job.status === "failed" && job.error && (
        <p className="text-sm text-red-500">{job.error}</p>
      )}

      {job.status === "completed" && job.result && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          asChild
          onClick={onClose}
        >
          <Link href={`/simulate/results/${job.id}`}>View Results</Link>
        </Button>
      )}
    </div>
  );
}

export function ComputingDrawer() {
  const [open, setOpen] = useAtom(computingDrawerOpenAtom);
  const [jobs] = useAtom(jobsAtom);

  const activeJobs = jobs.filter(
    (j) => j.status === "running" || j.status === "queued",
  );
  const completedJobs = jobs.filter(
    (j) =>
      j.status === "completed" ||
      j.status === "failed" ||
      j.status === "cancelled",
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <Cpu className="h-5 w-5" />
            Computing
          </SheetTitle>
          <SheetDescription className="flex items-center justify-between">
            <span>
              {activeJobs.length > 0
                ? `${activeJobs.length} simulation${activeJobs.length > 1 ? "s" : ""} running`
                : "No active simulations"}
            </span>
            <Link
              href="/computing"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Dashboard
            </Link>
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-8">
          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Active
              </h3>
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Recent
              </h3>
              <div className="space-y-3">
                {completedJobs.slice(0, 5).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {jobs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Cpu className="h-14 w-14 mx-auto mb-4 opacity-40" />
              <p className="text-base">No simulations yet</p>
              <p className="text-sm mt-1.5">
                Run a simulation to see progress here
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
