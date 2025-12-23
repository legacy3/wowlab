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
      <CardHeader>
        <CardTitle>Stat Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Stats */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Primary Stats</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Base Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.primaryStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell className="text-right">
                    {formatInt(stat.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Secondary Stats */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Secondary Stats</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Budget %</TableHead>
                <TableHead className="text-right">@ Level 80</TableHead>
                <TableHead className="text-right">Diminished</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.secondaryStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell className="text-right">
                    {formatInt(stat.rating)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInt(stat.budgetPercent)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInt(stat.percentAtLevel)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInt(stat.diminishedPercent)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            Total Secondary Budget: {formatInt(item.totalSecondaryBudget)}{" "}
            (100%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
