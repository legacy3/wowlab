"use client";

import type { BadgeProps } from "@/components/ui/badge";

import { Badge } from "@/components/ui";

interface StatusConfig {
  colorPalette: BadgeProps["colorPalette"];
  label: string;
  variant: BadgeProps["variant"];
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  offline: { colorPalette: "gray", label: "Offline", variant: "subtle" },
  online: { colorPalette: "green", label: "Online", variant: "solid" },
  pending: { colorPalette: "amber", label: "Pending", variant: "surface" },
};

const UNKNOWN_STATUS: StatusConfig = {
  colorPalette: "gray",
  label: "Unknown",
  variant: "outline",
};

interface NodeStatusBadgeProps {
  size?: BadgeProps["size"];
  status: string;
}

export function NodeStatusBadge({ size, status }: NodeStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? UNKNOWN_STATUS;

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
