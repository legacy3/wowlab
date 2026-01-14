"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WowItemLink } from "@/components/game";
import { CLASS_COLORS } from "@/atoms/dps-rankings";
import { useMostWantedItems } from "@/hooks/use-most-wanted-items";
import { TabHeader, RankingsCard, TabSkeleton } from "./shared";

export function MostWantedItemsTab() {
  const {
    result: mostWantedResult,
    query: { isLoading },
  } = useMostWantedItems();

  const mostWantedItems = mostWantedResult?.data ?? [];

  if (isLoading) {
    return <TabSkeleton titleWidth="w-48" rows={10} rowHeight="h-16" />;
  }

  return (
    <div className="space-y-6">
      <TabHeader
        title="Most Wanted Items"
        description="Items filtered by average DPS gain across uploaded simulations."
      />
      <RankingsCard
        footer="Item scores combine average DPS gain with pickup rate."
        totalCount={42}
        pageCount={4}
        pageSize={8}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14 text-center font-medium">
                  #
                </TableHead>
                <TableHead className="font-medium">Item</TableHead>
                <TableHead className="hidden font-medium md:table-cell">
                  Slot
                </TableHead>
                <TableHead className="hidden font-medium md:table-cell">
                  Classes
                </TableHead>
                <TableHead className="text-right font-medium">
                  Avg DPS Gain
                </TableHead>
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
                        <WowItemLink itemId={item.id as number} />
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
                      {item.classes.map((className: string) => {
                        const wowClass = className as keyof typeof CLASS_COLORS;
                        return (
                          <Badge
                            key={className}
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: CLASS_COLORS[wowClass],
                              color: CLASS_COLORS[wowClass],
                            }}
                          >
                            {className}
                          </Badge>
                        );
                      })}
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
      </RankingsCard>
    </div>
  );
}
