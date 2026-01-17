"use client";

import type { BadgeProps } from "@/components/ui/badge";

import { Badge } from "@/components/ui";

import type { NodeStatus } from "./types";

const STATUS_CONFIG: Record<
  NodeStatus,
  {
    label: string;
    colorPalette: BadgeProps["colorPalette"];
    variant: BadgeProps["variant"];
  }
> = {
  offline: { colorPalette: "gray", label: "Offline", variant: "subtle" },
  online: { colorPalette: "green", label: "Online", variant: "solid" },
  pending: { colorPalette: "amber", label: "Pending", variant: "surface" },
};

interface NodeStatusBadgeProps {
  size?: BadgeProps["size"];
  status: NodeStatus;
}

export function NodeStatusBadge({ size, status }: NodeStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      colorPalette={config.colorPalette}
      variant={config.variant}
      size={size}
    >
      {config.label}
    </Badge>
  );
}
