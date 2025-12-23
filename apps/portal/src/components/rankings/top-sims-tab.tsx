"use client";

import { ExternalLink, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CLASS_COLORS, type WowClass } from "@/atoms/dps-rankings";
import { useTopSims } from "@/hooks/use-top-sims";
import { TabHeader, EmptyState, RankingsCard, TabSkeleton } from "./shared";
import { formatDate, formatInt } from "@/lib/format";

export function TopSimsTab() {
  const {
    result: topSimsResult,
    query: { isLoading },
  } = useTopSims();
  const topSims = topSimsResult?.data ?? [];

  if (isLoading) {
    return <TabSkeleton titleWidth="w-32" rows={10} rowHeight="h-14" />;
  }

  return (
    <div className="space-y-6">
      <TabHeader
        title="Top Sims"
        description="Public character simulations uploaded in the last 30 days. Click a report to review rotation, gear, and log metadata."
      />
      <RankingsCard
        footer="Want to appear here? Upload your sim from the timeline or editor pages. We surface a rotating sample of the highest scoring public runs per spec."
        totalCount={topSims.length > 0 ? 50 : 0}
        pageCount={5}
        pageSize={6}
        showPagination={topSims.length > 0}
      >
        {topSims.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
            title="No simulations yet"
            description={
              <>
                Top simulations will appear here once data is available.
                <br />
                Run your first rotation simulation to get started.
              </>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Rotation</TableHead>
                  <TableHead className="hidden md:table-cell">Spec</TableHead>
                  <TableHead className="hidden lg:table-cell">Author</TableHead>
                  <TableHead className="text-right">DPS</TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Scenario
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Date
                  </TableHead>
                  <TableHead className="w-24 text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSims.map((sim, index) => (
                  <TableRow key={sim.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sim.rotationName}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {sim.spec} {sim.class}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: CLASS_COLORS[sim.class as WowClass],
                          color: CLASS_COLORS[sim.class as WowClass],
                        }}
                      >
                        {sim.spec} {sim.class}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {sim.author}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatInt(Math.round(sim.dps))}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                      {sim.scenario}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                      {formatDate(sim.simDate, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`#/sim/${sim.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </RankingsCard>
    </div>
  );
}
