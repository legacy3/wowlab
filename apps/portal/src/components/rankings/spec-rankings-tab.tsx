"use client";

import { useMemo } from "react";
import { useAtom } from "jotai";
import { BarChart3 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  selectedTierAtom,
  selectedFightLengthAtom,
  selectedTimeWindowAtom,
  CLASS_COLORS,
  RAID_TIERS,
  FIGHT_LENGTHS,
  TIME_WINDOWS,
  type WowClass,
} from "@/atoms/dps-rankings";
import { useSpecRankings } from "@/hooks/use-spec-rankings";
import { TabHeader, EmptyState, RankingsCard, TrendPill } from "./shared";

export function SpecRankingsTab() {
  const [tier, setTier] = useAtom(selectedTierAtom);
  const [fightLength, setFightLength] = useAtom(selectedFightLengthAtom);
  const [timeWindow, setTimeWindow] = useAtom(selectedTimeWindowAtom);
  const { result: specRankingsResult } = useSpecRankings();
  const specRankings = specRankingsResult?.data ?? [];

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
      <TabHeader
        title="Spec DPS Rankings"
        description="Snapshot of aggregated public simulations across all realms."
      >
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-[200px]" data-tour="rankings-tier">
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
          <SelectTrigger
            className="w-[180px]"
            data-tour="rankings-fight-length"
          >
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
          <SelectTrigger className="w-40" data-tour="rankings-time-window">
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
      </TabHeader>

      <div data-tour="rankings-results">
        <RankingsCard
          header={{
            title: specHeaderMeta.tier,
            description: `${specHeaderMeta.fight} • ${specHeaderMeta.window}`,
          }}
          footer="Rankings aggregate approved public simulations from the last 30 days. Data refreshes every hour."
          totalCount={60}
          pageCount={6}
          pageSize={10}
        >
          {specRankings.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6 text-muted-foreground" />}
              title="No rankings yet"
              description={
                <>
                  Rankings will appear here once simulation data is available.
                  <br />
                  Upload your first rotation simulation to get started.
                </>
              }
            />
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
                  {specRankings.map((ranking, index) => (
                    <TableRow
                      key={`${ranking.class}-${ranking.spec}`}
                      className={cn(
                        index < 3 &&
                          "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10/50",
                      )}
                    >
                      <TableCell className="text-center font-semibold">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                CLASS_COLORS[ranking.class as WowClass],
                            }}
                          />
                          <div>
                            <p className="font-medium">
                              {ranking.spec} {ranking.class}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {specHeaderMeta.window} • Median of top parses
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {Math.round(ranking.avgDps).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <TrendPill direction="flat" value={0} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {ranking.simCount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </RankingsCard>
      </div>
    </div>
  );
}
