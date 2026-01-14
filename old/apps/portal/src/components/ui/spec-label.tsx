"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASS_COLORS } from "@/lib/colors";
import { GameIcon } from "@/components/game";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";

interface SpecLabelProps {
  specId: number;
  size?: "sm" | "default" | "lg";
  showChevron?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function SpecLabel({
  specId,
  size = "default",
  showChevron = true,
  showIcon = false,
  className,
}: SpecLabelProps) {
  const { classes, specs } = useClassesAndSpecs();

  const spec = specs.result?.data?.find((s) => s.ID === specId);
  const classData = spec
    ? classes.result?.data?.find((c) => c.ID === spec.ClassID)
    : undefined;

  if (!spec || !classData) {
    return null;
  }

  // TODO Make all this less crappy
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const chevronSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const iconSize = size === "sm" ? "small" : size === "lg" ? "medium" : "small";

  const classColor = CLASS_COLORS[classData.Name_lang || ""] || "#FFFFFF";

  return (
    <span
      className={cn("flex items-center gap-1 font-medium", textSize, className)}
      style={{ color: classColor }}
    >
      {showIcon && spec.iconName && (
        <GameIcon
          iconName={spec.iconName}
          size={iconSize as "small" | "medium"}
          className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
        />
      )}
      {classData.Name_lang}
      {showChevron && (
        <ChevronRight className={cn("text-muted-foreground", chevronSize)} />
      )}
      {spec.Name_lang}
    </span>
  );
}
