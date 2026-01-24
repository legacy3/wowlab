"use client";

import type { LucideIcon } from "lucide-react";

import { CheckCircle2, Clock } from "lucide-react";
import { css } from "styled-system/css";
import { HStack } from "styled-system/jsx";

import type { DistributedJobStatus } from "@/lib/state";

import { Badge, InlineLoader } from "@/components/ui";

export const JOB_STATUS_COLORS: Record<
  DistributedJobStatus,
  { bg: string; text: string; border: string }
> = {
  completed: { bg: "green.3", border: "green.6", text: "green.11" },
  pending: { bg: "gray.3", border: "gray.6", text: "gray.11" },
  running: { bg: "blue.3", border: "blue.6", text: "blue.11" },
};

export const JOB_STATUS_ICONS: Record<DistributedJobStatus, LucideIcon | null> =
  {
    completed: CheckCircle2,
    pending: Clock,
    running: null,
  };

interface JobStatusBadgeProps {
  showIcon?: boolean;
  status: DistributedJobStatus;
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
