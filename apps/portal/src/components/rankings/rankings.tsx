"use client";

import { Suspense, useMemo } from "react";
import { useAtom } from "jotai";
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UrlTabs } from "@/components/ui/url-tabs";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { WowItemLink } from "@/components/game";
import {
  selectedTierAtom,
  selectedFightLengthAtom,
  selectedTimeWindowAtom,
  specRankingsAtom,
  topSimCharactersAtom,
  CLASS_COLORS,
  RAID_TIERS,
  FIGHT_LENGTHS,
  TIME_WINDOWS,
  type TrendDirection,
} from "@/atoms/dps-rankings";
import { useMostWantedItems } from "@/hooks/use-most-wanted-items";

function SpecRankingsTab() {
  const [tier, setTier] = useAtom(selectedTierAtom);
  const [fightLength, setFightLength] = useAtom(selectedFightLengthAtom);
  const [timeWindow, setTimeWindow] = useAtom(selectedTimeWindowAtom);
  const [specRankings] = useAtom(specRankingsAtom);

  const specHeaderMeta = useMemo(
    () => ({
      tier: RAID_TIERS.find((entry) => entry.value === tier)?.label ?? "",
      fight:
        FIGHT_LENGTHS.find((entry) => entry.value === fightLength)?.label ?? "",
      window:
        TIME_WINDOWS.find((entry) => entry.value === timeWindow)?.label ?? "",
    }),
    [tier, fightLength, timeWindow],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Spec DPS Rankings
          </h2>
          <p className="text-muted-foreground">
            Snapshot of aggregated public simulations across all realms.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Raid tier" />
            </SelectTrigger>
            <SelectContent>
              {RAID_TIERS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fightLength} onValueChange={setFightLength}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fight length" />
            </SelectTrigger>
            <SelectContent>
              {FIGHT_LENGTHS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time window" />
            </SelectTrigger>
            <SelectContent>
              {TIME_WINDOWS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            {specHeaderMeta.tier}
          </CardTitle>
          <CardDescription>
            {specHeaderMeta.fight} • {specHeaderMeta.window}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {specRankings.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No rankings yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rankings will appear here once simulation data is available.
                  <br />
                  Upload your first rotation simulation to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">#</TableHead>
                    <TableHead>Spec</TableHead>
                    <TableHead className="text-right">DPS</TableHead>
                    <TableHead className="w-32 text-right">Change</TableHead>
                    <TableHead className="w-32 text-right">Parses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specRankings.map((ranking) => (
                    <TableRow
                      key={ranking.rank}
                      className={cn(
                        ranking.rank <= 3 &&
                          "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10/50",
                      )}
                    >
                      <TableCell className="text-center font-semibold">
                        {ranking.rank}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: CLASS_COLORS[ranking.wowClass],
                            }}
                          />
                          <div>
                            <p className="font-medium">
                              {ranking.spec} {ranking.wowClass}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {specHeaderMeta.window} • Median of top parses
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {ranking.dps.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <TrendPill
                          direction={ranking.direction}
                          value={ranking.changePercent}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {ranking.sampleSize.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <TablePagination
            className="border-none pt-0"
            totalCount={60}
            pageCount={6}
            pageSize={10}
          />
        </CardContent>
        <CardFooter className="bg-muted/60 px-6 py-4 text-sm text-muted-foreground">
          Rankings aggregate approved public simulations from the last 30 days.
          Data refreshes every hour.
        </CardFooter>
      </Card>
    </div>
  );
}

function MostWantedItemsTab() {
  const {
    result: mostWantedResult,
    query: { isLoading },
  } = useMostWantedItems();

  const mostWantedItems = mostWantedResult?.data ?? [];

  if (isLoading) {
    return <MostWantedItemsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Most Wanted Items</h2>
        <p className="text-muted-foreground">
          Items filtered by average DPS gain across uploaded simulations.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden md:table-cell">Slot</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Classes
                  </TableHead>
                  <TableHead className="text-right">Avg DPS Gain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostWantedItems.map((item) => (
                  <TableRow key={item.rank}>
                    <TableCell className="text-center font-semibold">
                      {item.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          <WowItemLink itemId={item.id} quality={item.quality}>
                            {item.name}
                          </WowItemLink>
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {item.source}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {item.slot} • ilvl {item.itemLevel}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.classes.map((wowClass) => (
                          <Badge
                            key={wowClass}
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: CLASS_COLORS[wowClass],
                              color: CLASS_COLORS[wowClass],
                            }}
                          >
                            {wowClass}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      +{item.dpsGain} DPS
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            className="border-none pt-0"
            totalCount={42}
            pageCount={4}
            pageSize={8}
          />
        </CardContent>
        <CardFooter className="bg-muted/60 px-6 py-4 text-sm text-muted-foreground">
          Item scores combine average DPS gain with pickup rate.
        </CardFooter>
      </Card>
    </div>
  );
}

function TopSimsTab() {
  const [topSimCharacters] = useAtom(topSimCharactersAtom);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Top Sims</h2>
        <p className="text-muted-foreground">
          Public character simulations uploaded in the last 30 days. Click a
          report to review rotation, gear, and log metadata.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {topSimCharacters.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No simulations yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top simulations will appear here once data is available.
                  <br />
                  Run your first rotation simulation to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Character</TableHead>
                    <TableHead className="hidden md:table-cell">Spec</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Realm
                    </TableHead>
                    <TableHead className="text-right">DPS</TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Percentile
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-right">
                      Gearscore
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Date
                    </TableHead>
                    <TableHead className="w-24 text-right">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSimCharacters.map((sim, index) => (
                    <TableRow key={sim.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{sim.character}</span>
                          <span className="text-xs text-muted-foreground md:hidden">
                            {sim.spec} {sim.wowClass}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: CLASS_COLORS[sim.wowClass],
                            color: CLASS_COLORS[sim.wowClass],
                          }}
                        >
                          {sim.spec} {sim.wowClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {sim.realm} • {sim.region}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {sim.dps.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                        {sim.percentile}th
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums text-muted-foreground">
                        {sim.gearscore.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                        {sim.runDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={sim.reportUrl}
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
          {topSimCharacters.length > 0 && (
            <TablePagination
              className="border-none pt-0"
              totalCount={50}
              pageCount={5}
              pageSize={6}
            />
          )}
        </CardContent>
        <CardFooter className="bg-muted/60 px-6 py-4 text-sm text-muted-foreground">
          Want to appear here? Upload your sim from the timeline or editor
          pages. We surface a rotating sample of the highest scoring public runs
          per spec.
        </CardFooter>
      </Card>
    </div>
  );
}

function TrendPill({
  direction,
  value,
}: {
  readonly direction: TrendDirection;
  readonly value: number;
}) {
  if (direction === "flat") {
    return (
      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        {value.toFixed(1)}%
      </span>
    );
  }

  const isPositive = direction === "up";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        isPositive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function MostWantedItemsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DpsRankingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DpsRankingsInner() {
  return (
    <UrlTabs
      defaultTab="spec"
      tabs={[
        {
          value: "spec",
          label: "Spec Rankings",
          content: <SpecRankingsTab />,
        },
        {
          value: "items",
          label: "Most Wanted Items",
          content: <MostWantedItemsTab />,
        },
        {
          value: "sims",
          label: "Top Sims",
          content: <TopSimsTab />,
        },
      ]}
      listClassName="w-full max-w-xl justify-start overflow-x-auto"
    />
  );
}

export function DpsRankings() {
  return (
    <Suspense fallback={<DpsRankingsSkeleton />}>
      <DpsRankingsInner />
    </Suspense>
  );
}
