"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NodeStatusBadgeProps {
  status: string;
  className?: string;
}

export function NodeStatusBadge({ status, className }: NodeStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "online":
        return {
          label: "Online",
          variant: "default" as const,
          className:
            "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
        };
      case "offline":
        return {
          label: "Offline",
          variant: "secondary" as const,
          className:
            "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20",
        };
      case "pending":
        return {
          label: "Pending",
          variant: "outline" as const,
          className:
            "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <span
        className={cn(
          "mr-1.5 h-2 w-2 rounded-full",
          status === "online" && "bg-green-500 animate-pulse",
          status === "offline" && "bg-gray-500",
          status === "pending" && "bg-yellow-500 animate-pulse",
        )}
      />
      {config.label}
    </Badge>
  );
}
