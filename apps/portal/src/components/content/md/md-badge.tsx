import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type MdBadgeProps = {
  children: ReactNode;
  color?: "amber" | "green" | "red" | "gray";
  variant?: "solid" | "surface" | "subtle" | "outline";
};

export function MdBadge({
  children,
  color = "amber",
  variant = "surface",
}: MdBadgeProps) {
  return (
    <Badge colorPalette={color} variant={variant}>
      {children}
    </Badge>
  );
}
