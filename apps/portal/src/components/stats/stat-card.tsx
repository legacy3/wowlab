import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  badge?: ReactNode;
  className?: string;
  description?: string;
  icon?: ReactNode;
  iconBackgroundClassName?: string;
  label: string;
  value: string;
  valueClassName?: string;
};

export function StatCard({
  badge,
  className,
  description,
  icon,
  iconBackgroundClassName = "bg-primary/10",
  label,
  value,
  valueClassName = "text-2xl font-semibold",
}: StatCardProps) {
  const hasIcon = icon != null;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div
          className={cn(
            "gap-3",
            hasIcon ? "flex items-center" : "flex flex-col items-start gap-2",
          )}
        >
          {hasIcon ? (
            <div
              className={cn(
                "rounded-full p-2",
                iconBackgroundClassName,
                "flex items-center justify-center",
              )}
            >
              {icon}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn(valueClassName, "tabular-nums")}>{value}</p>
            {badge}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
