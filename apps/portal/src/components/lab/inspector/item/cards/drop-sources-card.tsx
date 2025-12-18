"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin } from "lucide-react";
import { useItemData } from "../item-context";

export function DropSourcesCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Drop Sources
        </CardTitle>
      </CardHeader>
      <CardContent>
        {item.dropSources.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instance</TableHead>
                <TableHead>Encounter</TableHead>
                <TableHead>Base iLvl</TableHead>
                <TableHead>Drop Chance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.dropSources.map((source, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{source.source}</TableCell>
                  <TableCell>{source.difficulty}</TableCell>
                  <TableCell>{source.baseItemLevel}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.dropChance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <MapPin className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Drop Sources</EmptyTitle>
              <EmptyDescription>
                No dungeon or raid drop sources found for this item.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
