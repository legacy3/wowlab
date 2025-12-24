"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | null;
  subtitle: string;
  emptySubtitle?: string;
  variant?: "default" | "success";
}

export function StatCard({
  label,
  value,
  subtitle,
  emptySubtitle = "Run a simulation",
  variant = "default",
}: StatCardProps) {
  if (value === null) {
    return (
      <Card className="border-muted-foreground/25 bg-muted/5">
        <CardHeader className="space-y-1.5 pb-4">
          <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </CardDescription>
          <CardTitle className="text-2xl tabular-nums text-muted-foreground">
            --
          </CardTitle>
          <p className="text-xs text-muted-foreground pt-1">{emptySubtitle}</p>
        </CardHeader>
      </Card>
    );
  }

  const cardClassName =
    variant === "success" ? "border-green-500/25 bg-green-500/5" : "";

  return (
    <Card className={cardClassName}>
      <CardHeader className="space-y-1.5 pb-4">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        <p className="text-xs text-muted-foreground pt-1">{subtitle}</p>
      </CardHeader>
    </Card>
  );
}
