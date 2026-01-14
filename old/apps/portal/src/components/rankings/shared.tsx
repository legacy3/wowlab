"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import type { TrendDirection } from "@/atoms/dps-rankings";
import { formatPercent } from "@/lib/format";

// Shared tab header component
interface TabHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function TabHeader({ title, description, children }: TabHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

// Shared empty state component
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-12 text-center">
      <div className="rounded-full bg-muted p-3">{icon}</div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Shared rankings card wrapper
interface RankingsCardProps {
  children: ReactNode;
  footer: string;
  header?: { title: string; description: string };
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  showPagination?: boolean;
}

export function RankingsCard({
  children,
  footer,
  header,
  totalCount = 0,
  pageCount = 1,
  pageSize = 10,
  showPagination = true,
}: RankingsCardProps) {
  return (
    <Card>
      {header && (
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-base font-medium">
            {header.title}
          </CardTitle>
          <CardDescription>{header.description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-4", !header && "pt-6")}>
        {children}
        {showPagination && totalCount > 0 && (
          <TablePagination
            className="border-none pt-0"
            totalCount={totalCount}
            pageCount={pageCount}
            pageSize={pageSize}
          />
        )}
      </CardContent>
      <CardFooter className="bg-muted/60 px-6 py-4 text-sm text-muted-foreground">
        {footer}
      </CardFooter>
    </Card>
  );
}

// Shared trend pill component
interface TrendPillProps {
  direction: TrendDirection;
  value: number;
}

export function TrendPill({ direction, value }: TrendPillProps) {
  if (direction === "flat") {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
        {formatPercent(value, 1)}
      </span>
    );
  }

  const isPositive = direction === "up";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        isPositive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3 shrink-0" />
      ) : (
        <ArrowDownRight className="h-3 w-3 shrink-0" />
      )}
      {isPositive ? "+" : ""}
      {formatPercent(value, 1)}
    </span>
  );
}

// Shared skeleton for tab content
interface TabSkeletonProps {
  titleWidth?: string;
  rows?: number;
  rowHeight?: string;
}

export function TabSkeleton({
  titleWidth = "w-48",
  rows = 10,
  rowHeight = "h-16",
}: TabSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className={cn("h-8", titleWidth)} />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className={cn("w-full", rowHeight)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
