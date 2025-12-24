"use client";

import { useAtomValue } from "jotai";
import { Loader2, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { workerSystemAtom, jobsAtom } from "@/atoms/computing";
import { formatCompact } from "@/lib/format";

export function IterationsCard() {
  const system = useAtomValue(workerSystemAtom);
  const jobs = useAtomValue(jobsAtom);
  const runningJob = jobs.find((j) => j.status === "running");

  return (
    <Card className="h-full p-4">
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
          <p className="text-lg font-bold tabular-nums">{runningJob.current}</p>
          <Progress value={runningJob.progress} className="h-1.5" />
        </div>
      ) : (
        <p className="text-2xl font-bold mt-1 tabular-nums">
          {formatCompact(system.totalIterationsRun)}
        </p>
      )}
    </Card>
  );
}
