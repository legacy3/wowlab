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
import { useSpellData } from "../spell-context";

export function ScalingCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Scaling & Difficulty
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Scaling Class</p>
            <p className="font-medium">
              {spell.scalingClassName} ({spell.scalingClass})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Scaling Level Range</p>
            <p className="font-medium">
              {spell.minScalingLevel} - {spell.maxScalingLevel}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Difficulty Overrides</h4>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Difficulty</TableHead>
                  <TableHead className="font-medium">Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spell.difficultyOverrides.map((d) => (
                  <TableRow key={d.difficultyId}>
                    <TableCell>
                      {d.difficulty} ({d.difficultyId})
                    </TableCell>
                    <TableCell>
                      {d.changes ? (
                        <span className="text-yellow-500">
                          PvP Multiplier: {d.changes.pvpMultiplier}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Base values
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
