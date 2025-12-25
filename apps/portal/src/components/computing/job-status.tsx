"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SimulationJob } from "@/atoms/computing";
import { cn } from "@/lib/utils";

export type JobStatus = SimulationJob["status"];

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  queued: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const JOB_STATUS_ICONS: Record<JobStatus, LucideIcon> = {
  running: Loader2,
  queued: Clock,
  completed: CheckCircle2,
  failed: XCircle,
  paused: Clock,
};

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
}

export function JobStatusBadge({
  status,
  className,
  showIcon = true,
}: JobStatusBadgeProps) {
  const StatusIcon = JOB_STATUS_ICONS[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 capitalize",
        JOB_STATUS_COLORS[status],
        className,
      )}
    >
      {showIcon ? (
        <StatusIcon
          className={cn("h-3.5 w-3.5", status === "running" && "animate-spin")}
        />
      ) : null}
      <span>{status}</span>
    </Badge>
  );
}
