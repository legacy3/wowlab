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
import { useItemData } from "../item-context";

export function DropSourcesCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Drop Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Base iLvl</TableHead>
              <TableHead>Drop Chance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.dropSources.map((source, i) => (
              <TableRow key={i}>
                <TableCell>{source.source}</TableCell>
                <TableCell>{source.difficulty}</TableCell>
                <TableCell>{source.baseItemLevel}</TableCell>
                <TableCell className="text-muted-foreground">
                  {source.dropChance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
