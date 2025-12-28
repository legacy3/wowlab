"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number | null;
  iconClassName?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className={iconClassName ?? "h-3.5 w-3.5"} />
        {label}
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{value ?? "—"}</p>
    </Card>
  );
}
