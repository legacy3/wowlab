"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInt } from "@/lib/format";
import { useItemData } from "../item-context";

export function StatBreakdownCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Stat Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {/* Primary Stats */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            Primary Stats
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Stat</TableHead>
                  <TableHead className="text-right font-medium">
                    Base Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.primaryStats.map((stat) => (
                  <TableRow key={stat.name}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(stat.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Secondary Stats */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            Secondary Stats
          </h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Stat</TableHead>
                  <TableHead className="text-right font-medium">
                    Rating
                  </TableHead>
                  <TableHead className="text-right font-medium">
                    Budget %
                  </TableHead>
                  <TableHead className="text-right font-medium">
                    @ Level 80
                  </TableHead>
                  <TableHead className="text-right font-medium">
                    Diminished
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.secondaryStats.map((stat) => (
                  <TableRow key={stat.name}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(stat.rating)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(stat.budgetPercent)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(stat.percentAtLevel)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(stat.diminishedPercent)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Total Secondary Budget:{" "}
            <span className="tabular-nums">
              {formatInt(item.totalSecondaryBudget)}
            </span>{" "}
            (100%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
