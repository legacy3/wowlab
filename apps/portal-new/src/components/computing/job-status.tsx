"use client";

import type { LucideIcon } from "lucide-react";

import { Ban, CheckCircle2, Clock, XCircle } from "lucide-react";
import { css } from "styled-system/css";
import { HStack } from "styled-system/jsx";

import type { JobStatus } from "@/lib/state";

import { Badge, InlineLoader } from "@/components/ui";

export const JOB_STATUS_COLORS: Record<
  JobStatus,
  { bg: string; text: string; border: string }
> = {
  cancelled: { bg: "orange.3", border: "orange.6", text: "orange.11" },
  completed: { bg: "green.3", border: "green.6", text: "green.11" },
  failed: { bg: "red.3", border: "red.6", text: "red.11" },
  paused: { bg: "yellow.3", border: "yellow.6", text: "yellow.11" },
  queued: { bg: "gray.3", border: "gray.6", text: "gray.11" },
  running: { bg: "blue.3", border: "blue.6", text: "blue.11" },
};

export const JOB_STATUS_ICONS: Record<JobStatus, LucideIcon | null> = {
  cancelled: Ban,
  completed: CheckCircle2,
  failed: XCircle,
  paused: Clock,
  queued: Clock,
  running: null,
};

interface JobStatusBadgeProps {
  showIcon?: boolean;
  status: JobStatus;
}

export function JobStatusBadge({
  showIcon = true,
  status,
}: JobStatusBadgeProps) {
  const StatusIcon = JOB_STATUS_ICONS[status];
  const colors = JOB_STATUS_COLORS[status];

  return (
    <Badge
      variant="outline"
      className={css({
        bg: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        textTransform: "capitalize",
      })}
    >
      <HStack gap="1">
        {showIcon &&
          (status === "running" ? (
            <InlineLoader variant="processing" />
          ) : StatusIcon ? (
            <StatusIcon style={{ height: 14, width: 14 }} />
          ) : null)}
        <span>{status}</span>
      </HStack>
    </Badge>
  );
}
