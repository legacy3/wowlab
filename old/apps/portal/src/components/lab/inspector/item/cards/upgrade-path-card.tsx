"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useItemData } from "../item-context";

export function UpgradePathCard() {
  const item = useItemData();
  const { upgradePath } = item;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Upgrade Path</CardTitle>
        <CardDescription className="text-xs">
          Season: {upgradePath.season} · Track: {upgradePath.track} (
          {upgradePath.trackRange}) · Level:{" "}
          <span className="tabular-nums">
            {upgradePath.currentLevel}/{upgradePath.maxLevel}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium">Level</TableHead>
                <TableHead className="font-medium">iLvl</TableHead>
                <TableHead className="font-medium">Crest Cost</TableHead>
                <TableHead className="font-medium">Flightstone</TableHead>
                <TableHead className="font-medium">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upgradePath.levels.map((level) => (
                <TableRow
                  key={level.level}
                  className={level.current ? "bg-primary/10" : ""}
                >
                  <TableCell className="tabular-nums">
                    {level.level}/{upgradePath.maxLevel}
                    {level.current && " ◄"}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {level.itemLevel}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {level.crestCost} {level.crestType}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {level.flightstoneCost}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {level.source || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {upgradePath.nextTracks.length > 0 && (
          <div className="space-y-1 text-sm">
            {upgradePath.nextTracks.map((track) => (
              <p key={track.name} className="text-muted-foreground">
                <span className="font-medium">{track.name}</span> ({track.range}
                ): {track.requirement}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
