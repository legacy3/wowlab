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
      <CardHeader>
        <CardTitle>Upgrade Path</CardTitle>
        <CardDescription>
          Season: {upgradePath.season} | Track: {upgradePath.track} (
          {upgradePath.trackRange}) | Current Level: {upgradePath.currentLevel}/
          {upgradePath.maxLevel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>iLvl</TableHead>
              <TableHead>Crest Cost</TableHead>
              <TableHead>Flightstone</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upgradePath.levels.map((level) => (
              <TableRow
                key={level.level}
                className={level.current ? "bg-primary/10" : ""}
              >
                <TableCell>
                  {level.level}/{upgradePath.maxLevel}
                  {level.current && " ◄"}
                </TableCell>
                <TableCell className="font-medium">{level.itemLevel}</TableCell>
                <TableCell>
                  {level.crestCost} {level.crestType}
                </TableCell>
                <TableCell>{level.flightstoneCost}</TableCell>
                <TableCell className="text-muted-foreground">
                  {level.source || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
